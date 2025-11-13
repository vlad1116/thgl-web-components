let connections = [];
let nextClientId = 1; // clientId 0 is the host (main controller)

function sendClientListToHost() {
  const host = connections.find((c) => c.clientId === 0);
  if (host) {
    const clientInfo = connections.map((c) => ({
      id: c.clientId,
      href: c.href,
      role: c.role,
    }));

    host.port.postMessage({
      type: "clientList",
      data: clientInfo,
    });
  }
}

self.onconnect = function (event) {
  const port = event.ports[0];

  // Temporary connection object until we get href and role
  const conn = { port, clientId: null, href: null, role: null };
  connections.push(conn);

  port.onmessage = function (e) {
    const message = e.data;

    switch (message.type) {
      case "identify": {
        conn.href = message.href;
        conn.role = message.role;

        // Assign clientId based on role
        if (message.role === "controller") {
          // Controller always gets clientId 0
          // First, check for existing controller
          const existingController = connections.find(
            (c) => c.clientId === 0 && c !== conn,
          );
          if (existingController) {
            // Reassign the old controller a new ID
            existingController.clientId = nextClientId++;
          }
          conn.clientId = 0;
        } else {
          // Other clients get sequential IDs
          conn.clientId = nextClientId++;
        }

        port.postMessage({
          type: "init",
          data: conn.clientId,
        });

        sendClientListToHost();
        break;
      }

      case "toClient": {
        // Ensure sender has been identified
        if (conn.clientId === null) {
          break;
        }

        const target = connections.find(
          (c) => c.clientId === message.targetClientId,
        );
        if (target) {
          target.port.postMessage({
            type: conn.clientId === 0 ? "fromMain" : "fromClient",
            from: conn.clientId,
            data: message.data,
          });
        }
        break;
      }

      case "sendBroadcast": {
        // Ensure sender has been identified
        if (conn.clientId === null) {
          break;
        }

        if (conn.clientId === 0) {
          connections.forEach((c) => {
            if (c.clientId !== conn.clientId) {
              c.port.postMessage({
                type: "broadcast",
                from: conn.clientId,
                data: message.data,
              });
            }
          });
        }
        break;
      }

      case "disconnect": {
        connections = connections.filter((c) => c !== conn);
        sendClientListToHost();
        break;
      }
    }
  };

  port.start();
};
