export interface Organization {
  id: string;
  name: string;
  code: string;
}

export interface ChildProfile {
  id: string;
  name: string;
  grade: string;
  avatar: string;
}

export const MOCK_ORGANIZATIONS: Organization[] = [
  { id: "1", name: "Trường THPT Nguyễn Huệ", code: "THPT-NH" },
  { id: "2", name: "Trường THCS Lê Lợi", code: "THCS-LL" },
  { id: "3", name: "Trung tâm Anh ngữ ABC", code: "TT-ABC" },
];

export const MOCK_CHILDREN: ChildProfile[] = [
  { id: "1", name: "Nguyễn Văn An", grade: "Lớp 10A1", avatar: "A" },
  { id: "2", name: "Nguyễn Thị Bình", grade: "Lớp 7B2", avatar: "B" },
];
