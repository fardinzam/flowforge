type ConnectionHandlesProps = {
  nodeId: string;
  isConnectingFrom: boolean;
  onConnectFrom(nodeId: string): void;
  onConnectTo(nodeId: string): void;
};

export function ConnectionHandles({
  nodeId,
  isConnectingFrom,
  onConnectFrom,
  onConnectTo,
}: ConnectionHandlesProps) {
  return (
    <span
      style={{
        display: "flex",
        gap: 8,
        marginTop: 10,
      }}
    >
      <button
        aria-pressed={isConnectingFrom}
        onClick={(event) => {
          event.stopPropagation();
          onConnectFrom(nodeId);
        }}
        type="button"
      >
        Connect from {nodeId}
      </button>
      <button
        onClick={(event) => {
          event.stopPropagation();
          onConnectTo(nodeId);
        }}
        type="button"
      >
        Connect to {nodeId}
      </button>
    </span>
  );
}
