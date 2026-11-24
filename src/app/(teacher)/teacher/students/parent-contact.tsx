/**
 * Tên phụ huynh trong danh sách học viên. Có số điện thoại thì là link gọi (`tel:`); không có số thì chỉ là chữ.
 * Q4-T21: trước đây luôn là thẻ `<a>` tô màu link kể cả khi không có `href`, bấm vào không có gì xảy ra.
 */
export function ParentContact({ name, phone, prefix = "" }: { name: string; phone?: string; prefix?: string }) {
  if (!phone) return <span>{`${prefix}${name}`}</span>;
  return (
    <a href={`tel:${phone}`} className="text-primary-600 hover:underline" aria-label={`Gọi phụ huynh ${name}: ${phone}`}>
      {`${prefix}${name}`}
    </a>
  );
}
