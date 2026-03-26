export type StudentStatus = "active" | "completed" | "paused";

export interface TeacherStudent {
  id: string;
  name: string;
  studentId: string;
  birthYear: number;
  avatar?: string;
  parentName: string;
  parentPhone?: string;
  courseId: string;
  courseName: string;
  status: StudentStatus;
}

export const TEACHER_MOCK_STUDENTS: TeacherStudent[] = [
  { id: "1", name: "Trần Hoàng Khôi", studentId: "HCM-NTT-007762", birthYear: 2020, parentName: "Trần Văn Trung", parentPhone: "0901234561", courseId: "1", courseName: "Lập trình Scratch Cơ bản", status: "active" },
  { id: "2", name: "Nguyễn Tuấn Anh", studentId: "HN-CGL-001234", birthYear: 2018, parentName: "Nguyễn Thị Lan", parentPhone: "0901234562", courseId: "2", courseName: "Python Nhập môn", status: "active" },
  { id: "3", name: "Lê Minh Tuấn", studentId: "DN-MT-009912", birthYear: 2019, parentName: "Lê Văn Hùng", parentPhone: "0901234563", courseId: "1", courseName: "Lập trình Scratch Cơ bản", status: "active" },
  { id: "4", name: "Hoàng Bảo Ngọc", studentId: "HN-HK-002231", birthYear: 2020, parentName: "Nguyễn Thu Hà", parentPhone: "0901234564", courseId: "2", courseName: "Python Nhập môn", status: "active" },
  { id: "5", name: "Vũ Đức Duy", studentId: "HCM-TB-003314", birthYear: 2017, parentName: "Vũ Đức Thịnh", parentPhone: "0901234565", courseId: "3", courseName: "JavaScript Pro", status: "active" },
  { id: "6", name: "Phan Mỹ Linh", studentId: "HN-TX-004456", birthYear: 2021, parentName: "Phan Văn An", parentPhone: "0901234566", courseId: "4", courseName: "AWS SAA C03", status: "active" },
  { id: "7", name: "Đỗ Gia Bảo", studentId: "HCM-Q1-008821", birthYear: 2018, parentName: "Đỗ Thành Danh", parentPhone: "0901234567", courseId: "3", courseName: "JavaScript Pro", status: "active" },
  { id: "8", name: "Lý Thanh Hằng", studentId: "DN-HC-001156", birthYear: 2019, parentName: "Lý Hoàng Nam", parentPhone: "0901234568", courseId: "4", courseName: "AWS SAA C03", status: "active" },
  { id: "9", name: "Bùi Minh Quân", studentId: "HN-LB-006823", birthYear: 2018, parentName: "Bùi Văn Thắng", parentPhone: "0901234569", courseId: "2", courseName: "Python Nhập môn", status: "active" },
  { id: "10", name: "Ngô Phương Anh", studentId: "HCM-PN-005511", birthYear: 2020, parentName: "Ngô Văn Hiếu", parentPhone: "0901234570", courseId: "1", courseName: "Lập trình Scratch Cơ bản", status: "active" },
];

export function getTeacherStudentById(id: string) {
  return TEACHER_MOCK_STUDENTS.find((student) => student.id === id);
}

export function getStudentsByCourseId(courseId: string) {
  return TEACHER_MOCK_STUDENTS.filter((student) => student.courseId === courseId);
}
