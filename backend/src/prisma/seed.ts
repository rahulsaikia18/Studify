import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Student Buddy database...');

  // 1. Create or update Demo Student User
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const user = await prisma.user.upsert({
    where: { email: 'student@buddy.edu' },
    update: {},
    create: {
      email: 'student@buddy.edu',
      passwordHash,
      fullName: 'Alex Johnson',
      educationLevel: 'University',
      institution: 'Tech Institute of Science',
      courseName: 'B.Tech Computer Science',
      semester: 'Semester 5',
      academicGoals: 'Maintain CGPA > 8.5, Master Data Structures, Ace GATE/GRE',
      theme: 'system',
      notificationPrefs: JSON.stringify({
        studyReminders: true,
        examAlerts: true,
        taskReminders: true,
        pomodoroSound: true,
      }),
    },
  });

  console.log(`👤 Created demo student: ${user.email} (Password: Password123!)`);

  // 2. Seed CGPA Record
  await prisma.cgpaRecord.deleteMany({ where: { userId: user.id } });
  await prisma.cgpaRecord.create({
    data: {
      userId: user.id,
      title: 'B.Tech Computer Science - Semesters 1 to 4',
      scaleType: '10_POINT',
      scaleConfig: JSON.stringify({
        scaleType: '10_POINT',
        percentageMultiplier: 9.5,
        gradeToPoint: { 'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'P': 4, 'F': 0 },
      }),
      semesters: JSON.stringify([
        {
          semesterNumber: 1,
          semesterName: 'Semester 1',
          totalCredits: 20,
          sgpa: 8.4,
          subjects: [
            { subjectName: 'Engineering Mathematics I', credits: 4, grade: 'A+', gradePoint: 9 },
            { subjectName: 'Physics for Computing', credits: 4, grade: 'A', gradePoint: 8 },
            { subjectName: 'Basic Electrical Eng', credits: 3, grade: 'B+', gradePoint: 7 },
            { subjectName: 'Programming in C', credits: 4, grade: 'O', gradePoint: 10 },
            { subjectName: 'Engineering Graphics', credits: 3, grade: 'A', gradePoint: 8 },
            { subjectName: 'Programming Lab', credits: 2, grade: 'O', gradePoint: 10 },
          ],
        },
        {
          semesterNumber: 2,
          semesterName: 'Semester 2',
          totalCredits: 22,
          sgpa: 8.7,
          subjects: [
            { subjectName: 'Engineering Mathematics II', credits: 4, grade: 'A+', gradePoint: 9 },
            { subjectName: 'Data Structures & Algorithms', credits: 4, grade: 'O', gradePoint: 10 },
            { subjectName: 'Digital Logic & Design', credits: 4, grade: 'A', gradePoint: 8 },
            { subjectName: 'Object Oriented Programming', credits: 4, grade: 'A+', gradePoint: 9 },
            { subjectName: 'Environmental Studies', credits: 3, grade: 'B+', gradePoint: 7 },
            { subjectName: 'DSA Lab', credits: 3, grade: 'O', gradePoint: 10 },
          ],
        },
      ]),
      cgpa: 8.56,
      percentage: 81.3,
      totalCredits: 42,
    },
  });

  // 3. Seed Attendance Courses
  await prisma.attendanceCourse.deleteMany({ where: { userId: user.id } });
  const dsa = await prisma.attendanceCourse.create({
    data: {
      userId: user.id,
      courseName: 'Data Structures & Algorithms',
      courseCode: 'CS301',
      totalClasses: 36,
      attendedClasses: 31,
      targetPercentage: 75,
      color: '#3B82F6',
    },
  });

  const os = await prisma.attendanceCourse.create({
    data: {
      userId: user.id,
      courseName: 'Operating Systems',
      courseCode: 'CS302',
      totalClasses: 32,
      attendedClasses: 23,
      targetPercentage: 75,
      color: '#EF4444',
    },
  });

  const dbms = await prisma.attendanceCourse.create({
    data: {
      userId: user.id,
      courseName: 'Database Management Systems',
      courseCode: 'CS303',
      totalClasses: 28,
      attendedClasses: 25,
      targetPercentage: 80,
      color: '#10B981',
    },
  });

  const cn = await prisma.attendanceCourse.create({
    data: {
      userId: user.id,
      courseName: 'Computer Networks',
      courseCode: 'CS304',
      totalClasses: 30,
      attendedClasses: 24,
      targetPercentage: 75,
      color: '#8B5CF6',
    },
  });

  // 4. Seed Study Sessions
  await prisma.studySession.deleteMany({ where: { userId: user.id } });
  const today = new Date();
  await prisma.studySession.createMany({
    data: [
      {
        userId: user.id,
        subject: 'Operating Systems',
        topic: 'Process Scheduling & Deadlocks',
        plannedMinutes: 90,
        actualMinutes: 90,
        priority: 'HIGH',
        completed: true,
        scheduledDate: today,
        notes: 'Review Banker algorithm and Semaphores',
      },
      {
        userId: user.id,
        subject: 'Data Structures',
        topic: 'Dynamic Programming on Trees',
        plannedMinutes: 60,
        actualMinutes: 45,
        priority: 'HIGH',
        completed: true,
        scheduledDate: today,
        notes: 'Solve LeetCode #337 House Robber III',
      },
      {
        userId: user.id,
        subject: 'Database Systems',
        topic: 'B+ Tree Indexing & Query Optimization',
        plannedMinutes: 45,
        actualMinutes: 0,
        priority: 'MEDIUM',
        completed: false,
        scheduledDate: today,
        notes: 'Read chapter 14 of Silberschatz',
      },
    ],
  });

  // 5. Seed Pomodoro Logs
  await prisma.pomodoroLog.deleteMany({ where: { userId: user.id } });
  await prisma.pomodoroLog.createMany({
    data: [
      {
        userId: user.id,
        sessionType: 'FOCUS',
        durationMinutes: 25,
        completed: true,
        startedAt: new Date(Date.now() - 3600000 * 3),
        endedAt: new Date(Date.now() - 3600000 * 3 + 1500000),
      },
      {
        userId: user.id,
        sessionType: 'SHORT_BREAK',
        durationMinutes: 5,
        completed: true,
        startedAt: new Date(Date.now() - 3600000 * 2.5),
        endedAt: new Date(Date.now() - 3600000 * 2.5 + 300000),
      },
      {
        userId: user.id,
        sessionType: 'FOCUS',
        durationMinutes: 25,
        completed: true,
        startedAt: new Date(Date.now() - 3600000 * 2),
        endedAt: new Date(Date.now() - 3600000 * 2 + 1500000),
      },
    ],
  });

  // 6. Seed Notes
  await prisma.note.deleteMany({ where: { userId: user.id } });
  await prisma.note.createMany({
    data: [
      {
        userId: user.id,
        title: 'B-Tree vs B+ Tree Core Differences',
        subject: 'Database Systems',
        tags: 'dbms,indexing,exam-prep',
        isPinned: true,
        content: `# B-Tree vs B+ Tree Comparison\n\n- **B-Tree**: Keys and records are stored in both internal and leaf nodes. Search can terminate early at internal nodes.\n- **B+ Tree**: Data pointers/records are ONLY stored in leaf nodes; internal nodes only store navigation keys.\n- **Leaf Linking**: In B+ Trees, all leaf nodes are connected via a doubly linked list, enabling fast range queries and sequential scans!\n- **Height**: B+ trees typically have a higher branching factor and shallower depth.`,
      },
      {
        userId: user.id,
        title: 'Quick Revision: Amdahl\'s Law & Concurrency',
        subject: 'Computer Architecture',
        tags: 'architecture,speedup,formulas',
        isPinned: false,
        content: `Speedup = 1 / ((1 - P) + (P / S))\n\nWhere:\n- P = Proportion of execution time that can be parallelized\n- S = Speedup factor of the parallel part\n\nKey Takeaway: The non-parallel portion of code strictly limits overall speedup!`,
      },
    ],
  });

  // 7. Seed Todo Tasks
  await prisma.todoTask.deleteMany({ where: { userId: user.id } });
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  await prisma.todoTask.createMany({
    data: [
      {
        userId: user.id,
        title: 'Submit OS Lab Assignment 4',
        description: 'Implement producer-consumer problem using POSIX mutex and semaphores',
        dueDate: tomorrow,
        priority: 'HIGH',
        category: 'Assignment',
        isCompleted: false,
      },
      {
        userId: user.id,
        title: 'Review Chapter 5 of Networking textbook',
        description: 'Focus on Subnetting, CIDR, and Distance Vector Routing',
        dueDate: nextWeek,
        priority: 'MEDIUM',
        category: 'Reading',
        isCompleted: false,
      },
      {
        userId: user.id,
        title: 'Renew Library Book on Algorithms',
        description: 'Return or renew CLRS 3rd edition',
        dueDate: today,
        priority: 'LOW',
        category: 'Personal',
        isCompleted: true,
        completedAt: today,
      },
    ],
  });

  // 8. Seed Exams
  await prisma.exam.deleteMany({ where: { userId: user.id } });
  const exam1 = new Date();
  exam1.setDate(exam1.getDate() + 12);
  const exam2 = new Date();
  exam2.setDate(exam2.getDate() + 24);

  await prisma.exam.createMany({
    data: [
      {
        userId: user.id,
        title: 'Mid-Term: Operating Systems',
        examDate: exam1,
        subjects: JSON.stringify(['Processes & Threads', 'CPU Scheduling', 'Synchronization & Deadlocks', 'Memory Management']),
        syllabusProgress: 75,
        priority: 'HIGH',
        notes: 'Room 304, Tech Block. Calculator not allowed.',
      },
      {
        userId: user.id,
        title: 'Finals: Database Management Systems',
        examDate: exam2,
        subjects: JSON.stringify(['ER Modeling', 'Relational Algebra', 'SQL Queries & Subqueries', 'Normalization (1NF-BCNF)', 'Indexing & Transactions']),
        syllabusProgress: 50,
        priority: 'HIGH',
        notes: 'Includes practical query evaluation section.',
      },
    ],
  });

  console.log('✅ Seed data successfully inserted into database!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
