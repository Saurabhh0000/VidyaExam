import {
  Building2,
  CreditCard,
  Fingerprint,
  Mail,
  Settings2,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import useAuthState from "../../auth/utils/useAuthState";
import PageHeader from "../../../shared/components/ui/PageHeader";
import "../styles/user-settings.css";

function displayRole(role) {
  return String(role || "—")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ProfileField({ label, value, icon: Icon }) {
  return <div className="user-settings-field">
    <dt>{Icon && <Icon size={15} aria-hidden="true" />}{label}</dt>
    <dd>{value || "Not available"}</dd>
  </div>;
}

function subscriptionValue(subscription, keys) {
  for (const key of keys) {
    if (subscription?.[key] !== undefined && subscription?.[key] !== null && subscription[key] !== "") {
      return String(subscription[key]);
    }
  }
  return "Not available";
}

export default function UserSettings() {
  const { user, subscription } = useAuthState();
  const memberships = user?.memberships || [];

  const teacherMode = String(user?.role || "").toUpperCase() === "TEACHER";

  return <main className={`user-settings-page${teacherMode ? " teacher-workspace-page" : ""}`}>
    <PageHeader
      className="user-settings-page-header"
      eyebrow="ACCOUNT & PREFERENCES"
      title="Settings"
      description="Review your account and organization information."
      icon={Settings2}
    />

    <section className="user-settings-card" aria-labelledby="user-settings-profile-title">
      <div className="user-settings-card-heading">
        <span><UserRound size={18} aria-hidden="true" /></span>
        <div><h2 id="user-settings-profile-title">Profile information</h2><p>Your account details</p></div>
      </div>
      <dl className="user-settings-grid">
        <ProfileField label="Full name" value={user?.name} icon={UserRound} />
        <ProfileField label="Email address" value={user?.email} icon={Mail} />
        <ProfileField label="Account role" value={displayRole(user?.role)} icon={ShieldCheck} />
        <ProfileField label="User ID" value={user?.userId} icon={Fingerprint} />
        {user?.activeTenantName && <ProfileField label="Current organization" value={user.activeTenantName} icon={Building2} />}
        {user?.activeTenantId && <ProfileField label="Organization ID" value={user.activeTenantId} icon={Fingerprint} />}
      </dl>
    </section>

    {memberships.length > 0 && <section className="user-settings-card" aria-labelledby="user-settings-memberships-title">
      <div className="user-settings-card-heading">
        <span><Building2 size={18} aria-hidden="true" /></span>
        <div><h2 id="user-settings-memberships-title">Organization access</h2><p>Organizations linked to your account</p></div>
      </div>
      <div className="user-settings-memberships">{memberships.map((membership) => <article key={`${membership.tenantId}-${membership.roleId}`}>
        <div><strong>{membership.tenantName || "Organization"}</strong><span>{displayRole(membership.roleName)}</span></div>
        <dl><ProfileField label="Organization ID" value={membership.tenantId} icon={Fingerprint} />{membership.tenantCode && <ProfileField label="Organization code" value={membership.tenantCode} />}</dl>
      </article>)}</div>
    </section>}

    {subscription && <section className="user-settings-card" aria-labelledby="user-settings-subscription-title">
      <div className="user-settings-card-heading">
        <span><CreditCard size={18} aria-hidden="true" /></span>
        <div><h2 id="user-settings-subscription-title">Subscription</h2><p>Plan information linked to your account</p></div>
      </div>
      <dl className="user-settings-grid">
        <ProfileField label="Plan" value={subscriptionValue(subscription, ["plan_name", "name", "planName"])} icon={CreditCard} />
        <ProfileField label="Status" value={displayRole(subscription.status)} icon={ShieldCheck} />
        <ProfileField label="Plan scope" value={displayRole(subscription.plan_scope || subscription.scope)} />
        <ProfileField label="Expires on" value={subscriptionValue(subscription, ["expires_at", "expiry_date", "end_date"])} />
      </dl>
    </section>}
  </main>;
}
