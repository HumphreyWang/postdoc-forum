// The two offset arms and compact nucleus read as a spiral even in the mobile header.
export default function ForumWordmark() {
  return (
    <>
      <svg className="galaxy-mark" viewBox="0 0 52 48" fill="none" aria-hidden="true" focusable="false">
        <g transform="rotate(-32 26 24)">
          <path fill="#183760" d="M3 27C0 15 12 7 27 7c11 0 19 5 19 11 0 6-8 10-17 10-6 0-11-2-12-5 3 2 7 2 11 2 8 0 13-3 13-6s-5-6-14-6C14 13 5 19 3 27Z"/>
          <path fill="#356ab8" d="M49 21c3 12-9 20-24 20-11 0-19-5-19-11 0-6 8-10 17-10 6 0 11 2 12 5-3-2-7-2-11-2-8 0-13 3-13 6s5 6 14 6c13 0 22-6 24-14Z"/>
          <ellipse cx="26" cy="24" rx="3.4" ry="2.3" fill="#163452"/>
        </g>
        <circle cx="44" cy="7" r="2" fill="#418894"/>
      </svg>
      <span className="brand-name">AstroConnect <b>2026</b></span>
    </>
  );
}
