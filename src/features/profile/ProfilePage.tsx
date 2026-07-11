import { ShieldCheck, UserRound } from 'lucide-react'
import { useAdminStore } from '../../store/adminStore'

export function ProfilePage() {
  const { user } = useAdminStore()

  return (
    <section className="profile-page">
      <div className="profile-hero">
        <span className="avatar is-large">
          <UserRound aria-hidden="true" size={34} />
        </span>
        <div>
          <h2>{user?.name ?? 'Admin Profile'}</h2>
          <p>{user?.email ?? 'No email available'}</p>
        </div>
      </div>

      <div className="profile-grid">
        <article className="profile-panel">
          <h3>Account</h3>
          <dl>
            <div>
              <dt>Type</dt>
              <dd>{user?.type ?? 'Admin'}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user?.email ?? '-'}</dd>
            </div>
          </dl>
        </article>

        <article className="profile-panel">
          <h3>Access</h3>
          <div className="profile-chip-list">
            {(user?.roles.length ? user.roles : ['admin']).map((role) => (
              <span className="profile-chip" key={role}>
                <ShieldCheck aria-hidden="true" size={15} />
                {role.replace('-', ' ')}
              </span>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}
