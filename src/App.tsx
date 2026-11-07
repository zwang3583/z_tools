import type { CSSProperties } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { TOOLS, type Tool } from './tools/registry'

function hueVars(tool: Tool): CSSProperties {
  return {
    '--band': tool.hue.band,
    '--band-ink': tool.hue.ink,
    '--accent': tool.hue.accent,
  } as CSSProperties
}

function Nav() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="wordmark" aria-label="z-tools home">
          z-tools
        </Link>
        <nav aria-label="Tools">
          <ul className="spines">
            {TOOLS.map((tool) => (
              <li key={tool.path}>
                <NavLink to={tool.path} className="spine" style={hueVars(tool)}>
                  <span className="spine-game">{tool.game}</span>
                  <span className="spine-title">{tool.title}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}

function Home() {
  return (
    <main className="page home">
      <h1 className="home-title">Utilities for the games you play</h1>
      <p className="home-lede">Each tool does one job, with data you can trace back to its source.</p>
      <ul className="shelf">
        {TOOLS.map((tool) => (
          <li key={tool.path}>
            <Link to={tool.path} className="shelf-item" style={hueVars(tool)}>
              <span className="shelf-band">{tool.game}</span>
              <span className="shelf-body">
                <span className="shelf-title">{tool.title}</span>
                <span className="shelf-summary">{tool.summary}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}

function ToolRoute({ tool }: { tool: Tool }) {
  return (
    <div className="tool" style={hueVars(tool)}>
      <div className="banner">
        <div className="banner-inner">
          <h1 className="banner-title">{tool.title}</h1>
          <p className="banner-game">{tool.game}</p>
        </div>
      </div>
      <tool.Page />
    </div>
  )
}

export function App() {
  const { pathname } = useLocation()
  return (
    <>
      <a className="skip" href="#content">
        Skip to content
      </a>
      <Nav />
      <div id="content" key={pathname}>
        <Routes>
          <Route path="/" element={<Home />} />
          {TOOLS.map((tool) => (
            <Route key={tool.path} path={tool.path} element={<ToolRoute tool={tool} />} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <footer className="footer">
        <p>Unofficial fan tools. Not affiliated with or endorsed by any game publisher.</p>
      </footer>
    </>
  )
}
