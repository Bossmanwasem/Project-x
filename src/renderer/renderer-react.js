const { useEffect, useMemo, useRef } = React;

const statusText = (window.projectX?.version ? `Installed · v${window.projectX.version}` : "Installed");

const App = () => {
  const canvasHostRef = useRef(null);
  const pixiApp = useMemo(() => new PIXI.Application(), []);

  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host) return undefined;

    let destroyed = false;

    const setupStage = async () => {
      await pixiApp.init({
        background: "#0b0f1a",
        width: 860,
        height: 480,
        antialias: true,
      });

      if (destroyed) return;

      host.appendChild(pixiApp.canvas);

      const gradient = new PIXI.Graphics();
      gradient.beginFill(0x111827);
      gradient.drawRoundedRect(0, 0, pixiApp.screen.width, pixiApp.screen.height, 28);
      gradient.endFill();

      const createZone = ({ x, y, width, height, label }) => {
        const zone = new PIXI.Graphics();
        zone.lineStyle(2, 0xd8d2c6, 0.7);
        zone.beginFill(0x0b1220, 0.65);
        zone.drawRoundedRect(x, y, width, height, 12);
        zone.endFill();

        const zoneLabel = new PIXI.Text(label, {
          fill: 0xd8d2c6,
          fontFamily: "Segoe UI, system-ui, sans-serif",
          fontSize: 12,
          letterSpacing: 2,
          fontWeight: "600",
        });
        zoneLabel.anchor.set(0.5, 1);
        zoneLabel.position.set(x + width / 2, y + height - 8);

        return { zone, zoneLabel };
      };

      const title = new PIXI.Text("Riftbound Battlefield Layout", {
        fill: 0xf5f7ff,
        fontFamily: "Segoe UI, system-ui, sans-serif",
        fontSize: 20,
        fontWeight: "600",
      });
      title.position.set(24, 18);

      const zones = [
        createZone({ x: 32, y: 56, width: 340, height: 120, label: "BATTLEFIELD" }),
        createZone({ x: 488, y: 56, width: 340, height: 120, label: "BATTLEFIELD" }),
        createZone({ x: 32, y: 190, width: 96, height: 112, label: "CHAMPION" }),
        createZone({ x: 138, y: 190, width: 96, height: 112, label: "LEGEND" }),
        createZone({ x: 244, y: 190, width: 444, height: 112, label: "BASE" }),
        createZone({ x: 698, y: 190, width: 130, height: 112, label: "MAIN DECK" }),
        createZone({ x: 32, y: 320, width: 130, height: 120, label: "RUNE DECK" }),
        createZone({ x: 176, y: 320, width: 512, height: 120, label: "RUNES" }),
        createZone({ x: 698, y: 320, width: 130, height: 120, label: "TRASH" }),
      ];

      pixiApp.stage.addChild(gradient, title);
      zones.forEach(({ zone, zoneLabel }) => pixiApp.stage.addChild(zone, zoneLabel));
    };

    setupStage();

    return () => {
      destroyed = true;
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
      React.createElement("h1", null, "Battlefield zones are live."),
      React.createElement(
        "p",
        { className: "subhead" },
        "The PixiJS stage now renders the full TCG battlefield layout for a single player side, including deck, base, and rune zones."
      ),
      React.createElement(
        "div",
        { className: "stage" },
        React.createElement("div", { className: "stage-canvas", ref: canvasHostRef }),
        React.createElement(
          "div",
          { className: "stage-meta" },
          React.createElement("h2", null, "Battlefield zones"),
          React.createElement(
            "ul",
            null,
            React.createElement("li", null, "Two battlefield lanes for units."),
            React.createElement("li", null, "Champion, legend, and base zones."),
            React.createElement("li", null, "Main deck, rune deck, runes, and trash.")
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
