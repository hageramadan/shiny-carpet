import Image from "next/image";

export default function ProfileAvatar({
  name,
  small = false,
}: {
  name?: string;
  small?: boolean;
}) {
  return (
    <Image
      src="/images/Profile.png"
      alt={name ? `صورة الملف الشخصي لـ ${name}` : "صورة الملف الشخصي"}
      width={72}
      height={72}
      sizes={small ? "48px" : "72px"}
      className={`shrink-0 rounded-full bg-[#e5f6f8] object-cover ${small ? "size-12" : "size-18"}`}
    />
  );
}
