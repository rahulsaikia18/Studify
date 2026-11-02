import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { PDFDocument } from 'pdf-lib';
import { useThemeStore } from '../../stores/themeStore';
import { HapticsService } from '../../services/HapticsService';
import { AdBanner } from '../../components/AdBanner';

interface PickedPDF {
  name: string;
  size: number;
  uri: string;
}

export default function PDFToolsScreen() {
  const { colors, isDark } = useThemeStore();
  const [activeTab, setActiveTab] = useState<'merge' | 'split' | 'compress'>('merge');
  const [selectedFiles, setSelectedFiles] = useState<PickedPDF[]>([]);
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handlePickPDFs = async (allowMultiple: boolean = true) => {
    try {
      HapticsService.light();
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: allowMultiple,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const files: PickedPDF[] = result.assets.map((asset) => ({
          name: asset.name,
          size: asset.size || 0,
          uri: asset.uri,
        }));

        if (activeTab === 'merge') {
          setSelectedFiles((prev) => [...prev, ...files]);
        } else {
          setSelectedFiles(files.slice(0, 1));
        }
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to pick PDF file: ' + err.message);
    }
  };

  const clearFiles = () => {
    setSelectedFiles([]);
    setStatusMessage(null);
  };

  const handleMergePDFs = async () => {
    if (selectedFiles.length < 2) {
      Alert.alert('Selection Required', 'Please select at least 2 PDF files to merge.');
      return;
    }

    setProcessing(true);
    setStatusMessage('Merging PDF pages locally with zero upload...');
    HapticsService.medium();

    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of selectedFiles) {
        let base64 = '';
        if (Platform.OS === 'web') {
          const res = await fetch(file.uri);
          const buf = await res.arrayBuffer();
          const doc = await PDFDocument.load(buf);
          const pages = await mergedPdf.copyPages(doc, doc.getPageIndices());
          pages.forEach((p) => mergedPdf.addPage(p));
          continue;
        }

        base64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const doc = await PDFDocument.load(base64);
        const pages = await mergedPdf.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => mergedPdf.addPage(p));
      }

      const mergedBytes = await mergedPdf.saveAsBase64();
      const cacheDir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory || '';
      const outputPath = `${cacheDir}merged_document_${Date.now()}.pdf`;

      if (Platform.OS !== 'web') {
        await FileSystem.writeAsStringAsync(outputPath, mergedBytes, {
          encoding: FileSystem.EncodingType.Base64,
        });

        setStatusMessage('Merge complete! Opening share sheet...');
        HapticsService.success();
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(outputPath);
        } else {
          Alert.alert('Done', 'PDF merged successfully.');
        }
      } else {
        setStatusMessage('Merged successfully in browser session.');
      }
    } catch (err: any) {
      Alert.alert('Merge Failed', err.message || 'Could not merge documents.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCompressPDF = async () => {
    if (selectedFiles.length === 0) {
      Alert.alert('Selection Required', 'Please select a PDF file to compress.');
      return;
    }

    setProcessing(true);
    setStatusMessage('Optimizing and compressing PDF streams...');
    HapticsService.medium();

    try {
      const file = selectedFiles[0];
      let doc: PDFDocument;

      if (Platform.OS === 'web') {
        const res = await fetch(file.uri);
        const buf = await res.arrayBuffer();
        doc = await PDFDocument.load(buf);
      } else {
        const base64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        doc = await PDFDocument.load(base64);
      }

      // Re-save with object streams enabled for structural compression
      const compressedBase64 = await doc.saveAsBase64({ useObjectStreams: true });
      const cacheDir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory || '';
      const outputPath = `${cacheDir}compressed_${Date.now()}.pdf`;

      if (Platform.OS !== 'web') {
        await FileSystem.writeAsStringAsync(outputPath, compressedBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const newFileInfo = await FileSystem.getInfoAsync(outputPath);
        const originalKb = Math.round(file.size / 1024);
        const newKb = newFileInfo.exists && (newFileInfo as any).size ? Math.round((newFileInfo as any).size / 1024) : originalKb;

        setStatusMessage(`Compressed! Size: ${originalKb} KB → ${newKb} KB. Opening file...`);
        HapticsService.success();

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(outputPath);
        }
      } else {
        setStatusMessage('Compressed successfully.');
      }
    } catch (err: any) {
      Alert.alert('Compression Error', err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
      {/* Privacy Guarantee Pill */}
      <View style={[styles.privacyNotice, { backgroundColor: isDark ? '#1E293B' : '#EFF6FF', borderColor: '#BFDBFE' }]}>
        <Ionicons name="shield-checkmark" size={18} color="#2563EB" style={{ marginRight: 8 }} />
        <Text style={[styles.privacyText, { color: colors.text }]}>
          100% Private: All document processing happens strictly on your device or in volatile memory. No student files are ever permanently saved on servers.
        </Text>
      </View>

      {/* Mode Switcher */}
      <View style={[styles.tabBar, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'merge' && [styles.activeTab, { backgroundColor: colors.card }]]}
          onPress={() => {
            HapticsService.light();
            setActiveTab('merge');
            clearFiles();
          }}
        >
          <Text style={[styles.tabText, { color: activeTab === 'merge' ? '#2563EB' : colors.textMuted }]}>
            PDF Merge
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'compress' && [styles.activeTab, { backgroundColor: colors.card }]]}
          onPress={() => {
            HapticsService.light();
            setActiveTab('compress');
            clearFiles();
          }}
        >
          <Text style={[styles.tabText, { color: activeTab === 'compress' ? '#2563EB' : colors.textMuted }]}>
            Compress
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'split' && [styles.activeTab, { backgroundColor: colors.card }]]}
          onPress={() => {
            HapticsService.light();
            setActiveTab('split');
            clearFiles();
          }}
        >
          <Text style={[styles.tabText, { color: activeTab === 'split' ? '#2563EB' : colors.textMuted }]}>
            Split Pages
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pick File Area */}
      <View style={[styles.dropZone, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.iconCircle}>
          <Ionicons name="document-attach" size={32} color="#2563EB" />
        </View>

        <Text style={[styles.dropTitle, { color: colors.text }]}>
          {activeTab === 'merge' ? 'Select 2 or more PDFs to combine' : 'Select a PDF document to optimize'}
        </Text>
        <Text style={[styles.dropSub, { color: colors.textMuted }]}>
          Supports lecture notes, question papers, syllabus, and assignment PDFs
        </Text>

        <TouchableOpacity
          style={styles.pickBtn}
          onPress={() => handlePickPDFs(activeTab === 'merge')}
          disabled={processing}
        >
          <Ionicons name="folder-open-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.pickBtnText}>Browse & Select PDF</Text>
        </TouchableOpacity>
      </View>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <View style={styles.filesContainer}>
          <View style={styles.filesHeaderRow}>
            <Text style={[styles.filesHeaderTitle, { color: colors.text }]}>
              Selected Documents ({selectedFiles.length})
            </Text>
            <TouchableOpacity onPress={clearFiles}>
              <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: '700' }}>Clear All</Text>
            </TouchableOpacity>
          </View>

          {selectedFiles.map((file, idx) => (
            <View key={idx} style={[styles.fileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="document" size={24} color="#EF4444" style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
                  {file.name}
                </Text>
                <Text style={[styles.fileSize, { color: colors.textMuted }]}>
                  {Math.round(file.size / 1024)} KB
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            </View>
          ))}

          {statusMessage && (
            <Text style={[styles.statusMsg, { color: '#2563EB' }]}>{statusMessage}</Text>
          )}

          {/* Action Trigger */}
          <TouchableOpacity
            style={[styles.processBtn, processing && styles.btnDisabled]}
            onPress={activeTab === 'merge' ? handleMergePDFs : handleCompressPDF}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons
                  name={activeTab === 'merge' ? 'git-merge-outline' : 'contract-outline'}
                  size={20}
                  color="#FFFFFF"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.processBtnText}>
                  {activeTab === 'merge' ? 'Merge Selected PDFs' : 'Compress & Save PDF'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      <AdBanner placement="PDF Tools Screen" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 36 },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  privacyText: { fontSize: 11, lineHeight: 16, flex: 1, fontWeight: '500' },
  tabBar: { flexDirection: 'row', borderRadius: 14, padding: 3, marginBottom: 16 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  activeTab: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '700' },
  dropZone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dropTitle: { fontSize: 15, fontWeight: '800', textAlign: 'center' },
  dropSub: { fontSize: 12, marginTop: 4, textAlign: 'center', marginBottom: 16 },
  pickBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
  pickBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  filesContainer: { marginTop: 4, marginBottom: 16 },
  filesHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  filesHeaderTitle: { fontSize: 14, fontWeight: '800' },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  fileName: { fontSize: 13, fontWeight: '700' },
  fileSize: { fontSize: 11, marginTop: 1 },
  statusMsg: { fontSize: 12, fontWeight: '700', textAlign: 'center', marginVertical: 8 },
  processBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  processBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
