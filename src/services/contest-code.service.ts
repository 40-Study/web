import { ApiError } from "@/lib/errors";
import { api } from "@/lib/api-client";
import type { ContestCodeSession, ContestCodeResult } from "@/types/contest";
type Envelope<T> = { data: T };
export interface ContestCodeInput {
  request_id: string;
  problem_id: string;
  language: string;
  code: string;
  stdin: string;
}
export const contestCodeService = {
  session: (id: string) =>
    api.get<Envelope<ContestCodeSession>>(`/contests/${id}/code`).then((r) => r.data.data),
  start: (id: string) =>
    api.post<Envelope<ContestCodeSession>>(`/contests/${id}/code/start`).then((r) => r.data.data),
  finish: (id: string) =>
    api.post<Envelope<ContestCodeSession>>(`/contests/${id}/code/finish`).then((r) => r.data.data),
  judge: (id: string, input: ContestCodeInput, submit: boolean) =>
    api
      .post<Envelope<ContestCodeResult>>(
        `/contests/${id}/code/${submit ? "submit" : "run"}`,
        input,
        { timeout: 70_000 }
      )
      .then((r) => r.data.data)
      .catch((e: unknown) => {
        if (e instanceof ApiError && e.status >= 500)
          throw new Error(
            "Máy chấm Judge0 chưa trả về kết quả. Bài nộp này chưa được tính; mã nguồn và điểm trước vẫn được giữ."
          );
        throw e;
      }),
};
