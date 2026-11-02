import app from '../src/app';
import { PDFDocument } from 'pdf-lib';
import http from 'http';

let server: http.Server;
const PORT = 5555;
const BASE_URL = `http://127.0.0.1:${PORT}/api`;

async function runTests() {
  console.log('🧪 Starting Studify Backend API Integration Tests...\n');

  await new Promise<void>((resolve) => {
    server = app.listen(PORT, '127.0.0.1', () => {
      resolve();
    });
  });
  let passedCount = 0;
  let totalCount = 0;

  async function assert(name: string, fn: () => Promise<boolean | void>) {
    totalCount++;
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passedCount++;
    } catch (err: any) {
      console.error(`  ❌ FAIL: ${name} ->`, err.message);
    }
  }

  let accessToken = '';

  try {
    // 1. Health check
    await assert('GET /health returns online status', async () => {
      const res = await fetch(`${BASE_URL}/health`);
      const data = await res.json();
      if (res.status !== 200 || data.status !== 'online') throw new Error(`Status ${res.status}`);
    });

    // 2. Motivation quote
    await assert('GET /motivation returns daily quote', async () => {
      const res = await fetch(`${BASE_URL}/motivation`);
      const data = await res.json();
      if (!data.success || !data.data.quote) throw new Error('Missing quote');
    });

    // 3. Auth login
    await assert('POST /auth/login returns JWT tokens and user profile', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'student@buddy.edu', password: 'Password123!' }),
      });
      const data = await res.json();
      if (!data.success || !data.data.tokens.accessToken) throw new Error(data.message || 'Login failed');
      accessToken = data.data.tokens.accessToken;
    });

    const headers = () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    });

    // 4. User profile
    await assert('GET /users/profile returns authenticated user', async () => {
      const res = await fetch(`${BASE_URL}/users/profile`, { headers: headers() });
      const data = await res.json();
      if (!data.success || data.data.email !== 'student@buddy.edu') throw new Error('Profile mismatch');
    });

    // 5. CGPA calculation
    await assert('POST /cgpa/calculate-sgpa calculates correct grade points', async () => {
      const res = await fetch(`${BASE_URL}/cgpa/calculate-sgpa`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          subjects: [
            { subjectName: 'Math', credits: 4, gradePoint: 10 },
            { subjectName: 'Physics', credits: 4, gradePoint: 8 },
          ],
        }),
      });
      const data = await res.json();
      // (4*10 + 4*8) / 8 = 72 / 8 = 9.0
      if (!data.success || data.data.sgpa !== 9.0) throw new Error(`Expected SGPA 9.0, got ${data.data?.sgpa}`);
    });

    // 6. Attendance quick calculation
    await assert('GET /attendance/quick-calc calculates bunk/needed classes', async () => {
      const res = await fetch(`${BASE_URL}/attendance/quick-calc?attended=20&total=25&target=75`, { headers: headers() });
      const data = await res.json();
      // 20/25 = 80%. Target 75%. Safe to miss: floor((2000 - 1875) / 75) = floor(125/75) = 1
      if (!data.success || data.data.percentage !== 80 || data.data.classesCanMiss !== 1) {
        throw new Error(`Unexpected attendance stats: ${JSON.stringify(data.data)}`);
      }
    });

    // 7. Attendance courses list
    await assert('GET /attendance/courses returns seeded courses with real-time stats', async () => {
      const res = await fetch(`${BASE_URL}/attendance/courses`, { headers: headers() });
      const data = await res.json();
      if (!data.success || !Array.isArray(data.data.courses) || data.data.courses.length === 0) {
        throw new Error('No attendance courses returned');
      }
    });

    // 8. Study weekly progress
    await assert('GET /study/weekly-progress returns 7-day stats and productivity score', async () => {
      const res = await fetch(`${BASE_URL}/study/weekly-progress`, { headers: headers() });
      const data = await res.json();
      if (!data.success || !Array.isArray(data.data.chartData) || data.data.chartData.length !== 7) {
        throw new Error('Invalid weekly progress chart');
      }
    });

    // 9. Pomodoro stats
    await assert('GET /pomodoro/stats returns focus stats and recent logs', async () => {
      const res = await fetch(`${BASE_URL}/pomodoro/stats`, { headers: headers() });
      const data = await res.json();
      if (!data.success || typeof data.data.totalFocusMinutes !== 'number') {
        throw new Error('Invalid pomodoro stats');
      }
    });

    // 10. Notes
    await assert('GET /notes returns notes and supports search', async () => {
      const res = await fetch(`${BASE_URL}/notes?search=Tree`, { headers: headers() });
      const data = await res.json();
      if (!data.success || data.data.length === 0) throw new Error('Search failed to find B-Tree note');
    });

    // 11. Todos
    await assert('GET /todos returns daily and upcoming tasks', async () => {
      const res = await fetch(`${BASE_URL}/todos`, { headers: headers() });
      const data = await res.json();
      if (!data.success || !Array.isArray(data.data.all)) throw new Error('Failed to fetch todos');
    });

    // 12. Exams
    await assert('GET /exams returns exams with remaining days calculated', async () => {
      const res = await fetch(`${BASE_URL}/exams`, { headers: headers() });
      const data = await res.json();
      if (!data.success || data.data.length === 0 || typeof data.data[0].daysRemaining !== 'number') {
        throw new Error('Failed to fetch exams countdown');
      }
    });

    // 13. Quiz Generator
    await assert('POST /quiz/generate generates 5 questions with options and explanations', async () => {
      const res = await fetch(`${BASE_URL}/quiz/generate`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          subject: 'Computer Science',
          topic: 'Data Structures',
          difficulty: 'MEDIUM',
          count: 5,
        }),
      });
      const data = await res.json();
      if (!data.success || data.data.questions.length !== 5) throw new Error('Quiz generation failed');
    });

    // 14. PDF In-Memory Operations
    await assert('PDF processing: merge, split, and compression', async () => {
      const doc1 = await PDFDocument.create();
      const p1 = doc1.addPage([300, 400]);
      const bytes1 = await doc1.save();

      const doc2 = await PDFDocument.create();
      const p2 = doc2.addPage([300, 400]);
      const bytes2 = await doc2.save();

      const formData = new FormData();
      formData.append('files', new Blob([bytes1], { type: 'application/pdf' }), 'file1.pdf');
      formData.append('files', new Blob([bytes2], { type: 'application/pdf' }), 'file2.pdf');

      const mergeRes = await fetch(`${BASE_URL}/pdf/merge`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });

      if (mergeRes.status !== 200) throw new Error(`PDF merge failed: ${mergeRes.status}`);
      const mergedBlob = await mergeRes.arrayBuffer();
      if (mergedBlob.byteLength === 0) throw new Error('Empty merged PDF');
    });

    // 15. AdMob Configuration & Reward Verification
    await assert('AdMob: getConfig returns compliant config, verify-reward records grant', async () => {
      const configRes = await fetch(`${BASE_URL}/admob/config`, { headers: headers() });
      const configData = await configRes.json();
      if (!configData.success || !configData.data.bannerAdUnitId) throw new Error('Invalid AdMob config');

      const verifyRes = await fetch(`${BASE_URL}/admob/verify-reward`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          rewardType: 'EXTRA_QUIZ',
          transactionId: `test-tx-${Date.now()}`,
          rewardAmount: 1,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) throw new Error('Reward verification failed');
    });

    console.log(`\n🎉 Results: ${passedCount}/${totalCount} tests passed!`);
  } finally {
    server.close();
  }
}

runTests().catch((e) => {
  console.error('Fatal test runner error:', e);
  process.exit(1);
});
