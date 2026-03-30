export function WindowControlSymbols() {
  return (
    <svg style={{ display: "none" }} xmlns="http://www.w3.org/2000/svg">
      <symbol id="window-control_close" viewBox="0 0 30 30">
        <line
          fill="none"
          stroke="currentcolor"
          strokeLinecap="round"
          x1="19.5"
          x2="10.5"
          y1="10.5"
          y2="19.5"
        />
        <line
          fill="none"
          stroke="currentcolor"
          strokeLinecap="round"
          x1="10.5"
          x2="19.5"
          y1="10.5"
          y2="19.5"
        />
      </symbol>
      <symbol id="window-control_maximize" viewBox="0 0 30 30">
        <rect
          fill="none"
          height="9"
          stroke="currentcolor"
          width="9"
          x="10.5"
          y="10.5"
        />
      </symbol>
      <symbol id="window-control_restore" viewBox="0 0 30 30">
        <polyline
          fill="none"
          points="13.5 12 13.5 9.5 20.5 9.5 20.5 16.5 18 16.5"
          stroke="currentcolor"
        />
        <rect
          fill="none"
          height="7"
          stroke="currentcolor"
          width="7"
          x="9.5"
          y="13.5"
        />
      </symbol>
      <symbol id="window-control_minimize" viewBox="0 0 30 30">
        <line
          fill="none"
          stroke="currentcolor"
          x1="10"
          x2="20"
          y1="19.5"
          y2="19.5"
        />
      </symbol>
    </svg>
  );
}
