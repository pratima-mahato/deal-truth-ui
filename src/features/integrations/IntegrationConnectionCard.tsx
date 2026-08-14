export const HUBSPOT_LOGO_URL = "https://cdn.justcall.io/app/assets/images/integrations/new/hubspot.png";
export const SLACK_LOGO_URL = "https://cdn.justcall.io/app/assets/images/integrations/new/slack.png";

const CONNECTED_LABEL = "Connected";
const DISCONNECTED_LABEL = "Not configured";

export function IntegrationConnectionCard({
  name,
  eyebrow,
  description,
  logoUrl,
  capabilities,
  connected = true,
}: {
  name: string;
  eyebrow: string;
  description: string;
  logoUrl: string;
  capabilities: string[];
  connected?: boolean;
}) {
  const status = connected ? CONNECTED_LABEL : DISCONNECTED_LABEL;
  return (
    <article className={`int-card card pad-lg reveal ${connected ? "on" : ""}`} aria-label={`${name} ${status}`}>
      <div className="between" style={{ marginBottom: 14, alignItems: "flex-start" }}>
        <div className="hstack" style={{ gap: 14, alignItems: "center" }}>
          <div className={`int-mark ${name.toLowerCase()}`}>
            <img src={logoUrl} alt="" className="int-logo" width={52} height={52} />
          </div>
          <div>
            <div className="eyebrow" style={{ color: connected ? "var(--proof)" : "var(--text-3)" }}>
              {eyebrow}
            </div>
            <h2 className="int-name">{name}</h2>
          </div>
        </div>
        <span className={`chip ${connected ? "proof" : ""}`}>
          {connected ? <span className="int-pulse" /> : null}
          {status}
        </span>
      </div>
      <p className="sub" style={{ fontSize: 13, maxWidth: "42ch" }}>
        {description}
      </p>
      <div className="int-ready">
        <span className={`stamp ${connected ? "proof" : "absent"} anim`}>{status}</span>
        <p className="tiny" style={{ margin: 0, color: "var(--text-2)" }}>
          Credentials stay on the integration service — this app never stores them.
        </p>
      </div>
      {capabilities.length > 0 ? (
        <ul className="int-caps" aria-label={`${name} capabilities`}>
          {capabilities.map((item) => (
            <li key={item}>
              <span aria-hidden>✓</span>
              {item}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
