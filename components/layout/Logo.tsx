import Image from "next/image";

export default function Logo() {
  return (
    <span className="inline-flex shrink-0 items-center">
      <Image
        src="/images/logo1.png"
        alt="Shiny Carpet - Shiny Carpet"
        width={432}
        height={328}
       
        className="object-cover w-18 h-15.5 "
      />
    </span>
  );
}
