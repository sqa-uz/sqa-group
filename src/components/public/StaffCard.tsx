import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { isLocalMediaUrl } from "@/lib/media-url";

export default function StaffCard({
  slug,
  name,
  position,
  photoUrl,
  department,
}: {
  slug: string;
  name: string;
  position: string;
  photoUrl: string | null;
  department: string;
}) {
  return (
    <Link href={`/team/${slug}`} className="card card-hover group block overflow-hidden">
      <div className="relative aspect-[4/5] overflow-hidden bg-band">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={name}
            fill
            unoptimized={isLocalMediaUrl(photoUrl)}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl font-bold text-primary/30">
            {name.charAt(0)}
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-[2px] bg-white/92 px-2 py-1 text-[11px] font-semibold text-primary backdrop-blur">
          {department}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-bold leading-snug text-ink group-hover:text-primary">{name}</h3>
        <p className="mt-1 text-sm leading-snug text-ink-soft">{position}</p>
      </div>
    </Link>
  );
}
