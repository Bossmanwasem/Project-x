const { useEffect, useMemo, useRef } = React;

const statusText = (window.projectX?.version ? `Installed · v${window.projectX.version}` : "Installed");

const App = () => {
  const canvasHostRef = useRef(null);
  const pixiApp = useMemo(() => {
    return new PIXI.Application({
      background: "#0b0f1a",
      width: 720,
      height: 420,
      antialias: true,
    });
  }, []);

  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host) return undefined;

    host.appendChild(pixiApp.view);

    const gradient = new PIXI.Graphics();
    gradient.beginFill(0x101a33);
    gradient.drawRoundedRect(0, 0, pixiApp.screen.width, pixiApp.screen.height, 24);
    gradient.endFill();

    const ring = new PIXI.Graphics();
    ring.lineStyle(6, 0x2b7bff, 0.9);
    ring.drawCircle(pixiApp.screen.width * 0.72, pixiApp.screen.height * 0.4, 84);

    const title = new PIXI.Text("Arena Preview", {
      fill: 0xf5f7ff,
      fontFamily: "Segoe UI, system-ui, sans-serif",
      fontSize: 28,
      fontWeight: "600",
    });
    title.position.set(36, 32);

    const subtitle = new PIXI.Text("PixiJS stage bootstrapped", {
      fill: 0x9fb3ff,
      fontFamily: "Segoe UI, system-ui, sans-serif",
      fontSize: 16,
    });
    subtitle.position.set(36, 72);

    const badge = new PIXI.Text("React + PixiJS", {
      fill: 0x0b0f1a,
      fontFamily: "Segoe UI, system-ui, sans-serif",
      fontSize: 14,
      fontWeight: "600",
    });
    badge.position.set(36, pixiApp.screen.height - 52);
    badge.style.padding = 8;

    const badgeBg = new PIXI.Graphics();
    badgeBg.beginFill(0xf5f7ff);
    badgeBg.drawRoundedRect(28, pixiApp.screen.height - 60, 150, 32, 999);
    badgeBg.endFill();

    pixiApp.stage.addChild(gradient, ring, title, subtitle, badgeBg, badge);

    return () => {
      pixiApp.destroy(true, { children: true });
    };
  }, [pixiApp]);

  return React.createElement(
    "main",
    { className: "shell" },
    React.createElement(
      "section",
      { className: "hero" },
      React.createElement("p", { className: "eyebrow" }, "Project X Digital Client"),
      React.createElement("h1", null, "React + PixiJS scaffold is live."),
      React.createElement(
        "p",
        { className: "subhead" },
        "This renderer now boots a React shell and mounts a PixiJS stage. Use this as the entry point for gameplay screens, overlays, and HUD elements."
      ),
      React.createElement(
        "div",
        { className: "stage" },
        React.createElement("div", { className: "stage-canvas", ref: canvasHostRef }),
        React.createElement(
          "div",
          { className: "stage-meta" },
          React.createElement("h2", null, "Scaffold checklist"),
          React.createElement(
            "ul",
            null,
            React.createElement("li", null, "React renderer bootstrapped."),
            React.createElement("li", null, "PixiJS stage mounted."),
            React.createElement("li", null, "Ready for UI composition.")
          ),
          React.createElement(
            "div",
            { className: "status" },
            React.createElement("span", { className: "label" }, "Client status"),
            React.createElement("span", { className: "pill" }, statusText)
          )
        )
      )
    )
  );
};

const root = document.getElementById("root");
ReactDOM.render(React.createElement(App), root);
