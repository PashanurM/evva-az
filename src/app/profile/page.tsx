import { ProfileView } from "@/components/profile/ProfileView";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata.profile;

export default function ProfilePage() {
  return (
    <section style={{ padding: "32px 0 60px" }}>
      <div className="container">
        <ProfileView />
      </div>
    </section>
  );
}
