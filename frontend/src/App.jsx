import { useState } from 'react'

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(
  /\/$/,
  '',
)

async function readApiResponse(response) {
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail =
      typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail)
    throw new Error(detail || `Request failed (${response.status})`)
  }
  return body
}

function App() {
  const [registration, setRegistration] = useState({
    username: '',
    place_of_birth: '',
    password: '',
  })
  const [lookupUsername, setLookupUsername] = useState('')
  const [registrationMessage, setRegistrationMessage] = useState('')
  const [registrationError, setRegistrationError] = useState('')
  const [lookupResult, setLookupResult] = useState('')
  const [lookupError, setLookupError] = useState('')
  const [registering, setRegistering] = useState(false)
  const [lookingUp, setLookingUp] = useState(false)

  async function handleRegister(event) {
    event.preventDefault()
    setRegistrationMessage('')
    setRegistrationError('')
    setRegistering(true)

    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registration),
      })
      const user = await readApiResponse(response)
      setRegistrationMessage(`User "${user.username}" registered successfully.`)
      setRegistration({ username: '', place_of_birth: '', password: '' })
    } catch (error) {
      setRegistrationError(error.message || 'Could not register the user.')
    } finally {
      setRegistering(false)
    }
  }

  async function handleLookup(event) {
    event.preventDefault()
    setLookupResult('')
    setLookupError('')
    setLookingUp(true)

    try {
      const response = await fetch(
        `${API_BASE_URL}/users/${encodeURIComponent(lookupUsername.trim())}`,
      )
      const user = await readApiResponse(response)
      setLookupResult(
        `Username found: ${user.username} · Place of birth: ${
          user.place_of_birth || 'Not provided'
        }`,
      )
    } catch (error) {
      setLookupError(error.message || 'Could not find the user.')
    } finally {
      setLookingUp(false)
    }
  }

  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">DEVOPS PRACTICE</p>
        <h1>User directory</h1>
        <p className="intro">
          A small app for practicing React, FastAPI, and PostgreSQL.
        </p>
      </header>

      <div className="cards">
        <section className="card" aria-labelledby="register-heading">
          <div className="card-heading">
            <span className="step">01</span>
            <div>
              <h2 id="register-heading">Register a user</h2>
              <p>Create a user record in the database.</p>
            </div>
          </div>
          <form onSubmit={handleRegister}>
            <label htmlFor="register-username">Username</label>
            <input
              id="register-username"
              name="username"
              autoComplete="username"
              value={registration.username}
              onChange={(event) =>
                setRegistration({ ...registration, username: event.target.value })
              }
              required
            />
            <label htmlFor="register-place-of-birth">Place of birth</label>
            <input
              id="register-place-of-birth"
              name="place_of_birth"
              autoComplete="off"
              value={registration.place_of_birth}
              onChange={(event) =>
                setRegistration({
                  ...registration,
                  place_of_birth: event.target.value,
                })
              }
              required
            />
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={registration.password}
              onChange={(event) =>
                setRegistration({ ...registration, password: event.target.value })
              }
              required
            />
            <button type="submit" disabled={registering}>
              {registering ? 'Registering…' : 'Register user'}
            </button>
          </form>
          {registrationMessage && (
            <p className="feedback success" role="status">
              {registrationMessage}
            </p>
          )}
          {registrationError && (
            <p className="feedback error" role="alert">
              {registrationError}
            </p>
          )}
        </section>

        <section className="card" aria-labelledby="lookup-heading">
          <div className="card-heading">
            <span className="step">02</span>
            <div>
              <h2 id="lookup-heading">Look up a user</h2>
              <p>Find a registered user by username.</p>
            </div>
          </div>
          <form onSubmit={handleLookup}>
            <label htmlFor="lookup-username">Username</label>
            <input
              id="lookup-username"
              name="username"
              autoComplete="off"
              value={lookupUsername}
              onChange={(event) => setLookupUsername(event.target.value)}
              required
            />
            <button type="submit" disabled={lookingUp}>
              {lookingUp ? 'Searching…' : 'Find user'}
            </button>
          </form>
          {lookupResult && (
            <p className="feedback result" role="status">
              {lookupResult}
            </p>
          )}
          {lookupError && (
            <p className="feedback error" role="alert">
              {lookupError}
            </p>
          )}
        </section>
      </div>

      <footer>
        API endpoint: <code>{API_BASE_URL}</code>
      </footer>
    </main>
  )
}

export default App
