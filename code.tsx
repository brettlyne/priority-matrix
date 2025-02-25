const { widget } = figma;
const {
  AutoLayout,
  Frame,
  Text,
  SVG,
  Rectangle,
  useSyncedState,
  useEffect,
  Ellipse,
  Image,
  useSyncedMap,
  usePropertyMenu,
} = widget;

// UTILITY FUNCTIONS
const average = (array) => array.reduce((a, b) => a + b) / array.length;
// NUMBER TO LETTER
// https://github.com/MatthewMueller/number-to-letter
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const base = alphabet.length;
const numToLetter = (n) => {
  var digits = [];
  do {
    var v = n % base;
    digits.push(v);
    n = Math.floor(n / base);
  } while (n-- > 0);
  var chars = [];
  while (digits.length) {
    chars.push(alphabet[digits.pop()]);
  }
  return chars.join("");
};

interface UserResponse {
  userId: number;
  userPhoto: string;
  responses: [
    {
      questionIdx: number;
      xRating: number;
      yRating: number;
    }
  ];
}

const CHART_SIZE = 540;
const DOT_SIZE = 24;

function Widget() {
  const responsesByUser = useSyncedMap("responsesByUser");
  const [xAxisLabel, setXAxisLabel] = useSyncedState("xAxisLabel", "Effort");
  const [yAxisLabel, setYAxisLabel] = useSyncedState("yAxisLabel", "Impact");
  const [scaleStart, setScaleStart] = useSyncedState("scaleStart", 1);
  const [scaleEnd, setScaleEnd] = useSyncedState("scaleEnd", 5);

  const [ideas, setIdeas] = useSyncedState("ideas", []);
  const [pluginStatus, setPluginStatus] = useSyncedState(
    "pluginStatus",
    "setup"
  );
  const [bigMode, setBigMode] = useSyncedState("bigMode", false);
  const [selectedIdeaIndex, setSelectedIdeaIndex] = useSyncedState(
    "selectedIdeaIndex",
    -1
  );

  // Helper functions for chart positioning
  const getX = (x: number): number => {
    const step = CHART_SIZE / (scaleEnd - scaleStart);
    return 20 + (x - scaleStart) * step;
  };
  const getY = (y: number): number => {
    const step = CHART_SIZE / (scaleEnd - scaleStart);
    return 40 + (scaleEnd - y) * step;
  };

  useEffect(() => {
    figma.ui.on("message", (message) => {
      const msg = JSON.parse(message);

      if (msg.msgType === "importSelectedIdeas") {
        const ideas = [];
        for (const node of figma.currentPage.selection) {
          if ("text" in node && node.text.characters.length > 0) {
            ideas.push(node.text.characters);
          }
        }
        figma.notify(
          `${ideas.length} item${ideas.length !== 1 ? "s" : ""} found`
        );
        if (ideas.length > 0) {
          const importMsg = { msgType: "IMPORT", ideas };
          figma.ui.postMessage(JSON.stringify(importMsg));
        }
      }

      if (msg.msgType === "startVoting") {
        setPluginStatus("voting");
        setIdeas(msg.ideas);
        setXAxisLabel(msg.xAxis);
        setYAxisLabel(msg.yAxis);
        setScaleStart(msg.scaleStart);
        setScaleEnd(msg.scaleEnd);
        sendStateToUi({
          pluginStatus: "voting",
          ideas: msg.ideas,
          xAxis: msg.xAxis,
          yAxis: msg.yAxis,
          scaleStart: msg.scaleStart,
          scaleEnd: msg.scaleEnd,
        });
      }

      if (msg.msgType === "newResponse") {
        responsesByUser.set(msg.userId, {
          userPhoto: msg.userPhoto,
          responses: msg.responses,
        });
      }

      if (msg.msgType === "addResponse") {
        const userResponses = responsesByUser.get(msg.userId) as UserResponse;
        if (userResponses && userResponses.responses) {
          userResponses.responses[msg.responseIdx][`${msg.axis}Rating`] =
            msg.value;
          responsesByUser.set(msg.userId, userResponses);
        }
      }

      if (msg.msgType === "closePlugin") {
        figma.closePlugin();
      }
    });
  });

  const sendStateToUi = (optionalState?) => {
    figma.ui.postMessage(
      JSON.stringify({
        msgType: "STATE",
        pluginStatus: optionalState?.pluginStatus || pluginStatus,
        ideas: optionalState?.ideas ?? ideas,
        xAxis: optionalState?.xAxis ?? xAxisLabel,
        yAxis: optionalState?.yAxis ?? yAxisLabel,
        scaleStart: optionalState?.scaleStart ?? scaleStart,
        scaleEnd: optionalState?.scaleEnd ?? scaleEnd,
        userId: figma.currentUser.id,
        userPhoto: figma.currentUser.photoUrl,
        responsesByUser: responsesByUser.get(figma.currentUser.id),
      })
    );
  };

  const showUI = () => {
    figma.showUI(__html__, { width: 648, height: 420 });
    sendStateToUi();
  };

  const dataPlot = [];
  if (pluginStatus === "revealed" && ideas.length > 0) {
    for (let i = 0; i < ideas.length; i++) {
      const xRatings = [];
      const yRatings = [];

      responsesByUser.keys().forEach((key) => {
        const resp = responsesByUser.get(key) as UserResponse;
        const match = resp.responses.find(
          (response) => response.questionIdx === i
        );
        if (match.xRating !== null && match.yRating !== null) {
          xRatings.push(match.xRating);
          yRatings.push(match.yRating);
        }
      });

      if (xRatings.length === 0 || yRatings.length === 0) {
        continue;
      }
      const avgX = average(xRatings);
      const avgY = average(yRatings);
      const letter = numToLetter(i);
      const pointMatchIdx = dataPlot.findIndex((point) => {
        return point.avgX === avgX && point.avgY === avgY;
      });
      if (pointMatchIdx >= 0) {
        dataPlot[pointMatchIdx].letter += `,${letter}`;
        dataPlot[pointMatchIdx].ideaIndices.push(i);
      } else {
        dataPlot.push({ avgX, avgY, letter, idea: ideas[i], ideaIndices: [i] });
      }
    }
  }

  const userImages = () => {
    const imgDotsData = [];
    responsesByUser.keys().forEach((key) => {
      const resp = responsesByUser.get(key) as UserResponse;
      const match = resp.responses.find(
        (response) => response.questionIdx === selectedIdeaIndex
      );
      const x = match.xRating === null ? -1 : match.xRating;
      const y = match.yRating === null ? -1 : match.yRating;
      const samePointProceedingCount = imgDotsData.filter(
        (dot) => dot.x === x && dot.y === y
      ).length;
      imgDotsData.push({
        key: resp.userId,
        userPhoto: resp.userPhoto,
        x,
        y,
        samePointProceedingCount,
      });
    });

    const imgDots = imgDotsData.map((dot) => (
      <Image
        key={dot.key}
        x={getX(dot.x) - DOT_SIZE / 2 + dot.samePointProceedingCount * 12}
        y={getY(dot.y) - DOT_SIZE / 2}
        width={DOT_SIZE}
        height={DOT_SIZE}
        cornerRadius={DOT_SIZE / 2}
        src={dot.userPhoto}
      />
    ));

    return imgDots;
  };

  const selectedIdeaDotIndex = dataPlot.findIndex((data) =>
    data.ideaIndices.includes(selectedIdeaIndex)
  );

  const propMenu = [];

  if (pluginStatus === "revealed" && ideas.length > 0) {
    propMenu.push({
      itemType: "action",
      propertyName: "view-csv",
      tooltip: "View data as CSV",
    });
  }

  if (bigMode) {
    propMenu.push({
      itemType: "action",
      propertyName: "toggleBigMode",
      tooltip: "Small mode",
      icon: `<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><g clip-path="url(#a)"><path fill="#1E1E1E" d="M0 0h24v24H0z"/><rect width="11" height="11" x=".5" y="12.5" stroke="#fff" rx="1.5"/><path stroke="#fff" stroke-linecap="round" d="M13.5 23.5h8a2 2 0 0 0 2-2v-19a2 2 0 0 0-2-2h-19a2 2 0 0 0-2 2v8m13 0 7-7m-7 7V6.9m0 3.6h3.4"/></g><defs><clipPath id="a"><path fill="#fff" d="M0 0h24v24H0z"/></clipPath></defs></svg>`,
    });
  } else {
    propMenu.push({
      itemType: "action",
      propertyName: "toggleBigMode",
      tooltip: "Big mode",
      icon: `<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><g clip-path="url(#a)"><path fill="#1E1E1E" d="M0 0h24v24H0z"/><rect width="11" height="11" x=".5" y="12.5" stroke="#fff" rx="1.5"/><path stroke="#fff" stroke-linecap="round" d="M13.5 23.5h6a4 4 0 0 0 4-4v-15a4 4 0 0 0-4-4h-15a4 4 0 0 0-4 4v6m19.9-7.1-7 7m7-7V7m0-3.6H17"/></g><defs><clipPath id="a"><path fill="#fff" d="M0 0h24v24H0z"/></clipPath></defs></svg>`,
    });
  }

  usePropertyMenu(propMenu, ({ propertyName }) => {
    if (propertyName === "view-csv") {
      // Generate CSV data
      const csvRows = [
        "Idea,Letter," +
          xAxisLabel +
          "," +
          yAxisLabel +
          "," +
          `${xAxisLabel} x ${yAxisLabel}`,
      ];

      for (let i = 0; i < ideas.length; i++) {
        const xRatings = [];
        const yRatings = [];

        responsesByUser.keys().forEach((key) => {
          const resp = responsesByUser.get(key) as UserResponse;
          const match = resp.responses.find(
            (response) => response.questionIdx === i
          );
          if (match.xRating !== null && match.yRating !== null) {
            xRatings.push(match.xRating);
            yRatings.push(match.yRating);
          }
        });

        const escapedIdea = ideas[i].trim().replace(/[,\n\r]+/g, " ");
        const letter = numToLetter(i);
        if (xRatings.length > 0 && yRatings.length > 0) {
          const avgX = average(xRatings);
          const avgY = average(yRatings);
          const avgXY = avgX * avgY;
          csvRows.push(
            `${escapedIdea},${letter},${avgX.toFixed(2)},${avgY.toFixed(
              2
            )},${avgXY.toFixed(2)}`
          );
        } else {
          csvRows.push(`${escapedIdea},${letter},,`);
        }
      }

      // Copy to clipboard
      return new Promise((resolve) => {
        figma.showUI(__html__, { visible: true, height: 500, width: 600 });
        figma.ui.postMessage(
          JSON.stringify({
            msgType: "OPEN_AS_CSV",
            csvData: csvRows.join("\n"),
          })
        );
      });
    } else if (propertyName === "toggleBigMode") {
      setBigMode(!bigMode);
    }
  });

  return (
    <AutoLayout width="hug-contents" height="hug-contents">
      <Frame width={600} height={600}>
        <SVG
          x={20}
          src='<svg className="logo" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 260 28" width="260px" height="28px"><path fill="#385959" d="M12 0h236v28H12zM256 8h4v4h-4zM252 4h4v4h-4zM248 0h4v4h-4zM256 16h4v4h-4zM252 12h4v4h-4zM248 4h4v8h-4zM256 24h4v4h-4zM252 20h4v4h-4z" /><path fill="#fff" d="M28 16h-4v8h-4V4h12.1v4h-8v4h4v4Zm.1-8h4v8h-4V8ZM36.6 4h12v4h-8v4h4v4h4v8h-4v-8h-4v8h-4V4Zm8 4h4v4h-4V8ZM53.1 4h4v20h-4V4ZM61.7 4h4v20h-4V4Zm4 0h8v20h-8v-4h4V8h-4V4ZM78.3 4h12v4h-8v4h4v4h4v8h-4v-8h-4v8h-4V4Zm8 4h4v4h-4V8ZM94.8 4h4v20h-4V4ZM103.3 4h12v4h-4v16h-4V8h-4V4ZM119.9 4h3.9v8h4V4h4v12h-4v8h-4v-8h-4V4ZM145 4h4v4h4v4h4V8h4V4h4v20h-4V12h-4v4h-4v-4h-4v12h-4V4ZM169.5 4h12v20h-4V8h-4v16h-4V4Zm4 8h4v4h-4v-4ZM186 4h12v4h-4v16h-3.9V8h-4V4ZM202.7 4h12v4h-8v4h4v4h4v8h-4v-8h-4v8h-4V4Zm8 4h4v4h-4V8ZM219.2 4h4v20h-4V4ZM227.8 4h4v8h4V4h4v8h-4v4h4v8h-4v-8h-4v8h-4v-8h4v-4h-4V4Z" /><path fill="#385959" d="M4 0H0v4h4zM8 4H4v4h4zM12 8H8v4h4zM4 8H0v4h4zM8 12H4v4h4zM12 16H8v9h4zM4 16H0v4h4zM8 20H4v4h4z" /><path fill="#385959" d="M12 24H8v4h4z" /></svg>'
        />
        {pluginStatus === "revealed" && (
          <AutoLayout
            direction="horizontal"
            horizontalAlignItems="center"
            verticalAlignItems="center"
            width={200}
            height={28}
            x={360}
            y={0}
            // fill="#107680"
            fill="#5E57A4"
            cornerRadius={4}
            onClick={async () => {
              await new Promise((resolve) => {
                showUI();
              });
            }}
          >
            <Text
              fontSize={14}
              fontWeight={700}
              width="hug-contents"
              lineHeight={20}
              fill={"#ffffff"}
              onClick={async () => {
                await new Promise((resolve) => {
                  showUI();
                });
              }}
            >
              Add or edit your ratings
            </Text>
          </AutoLayout>
        )}

        {/* CHART BACKGROUND */}
        <SVG
          x={20}
          y={40}
          width={540}
          height={540}
          src={`
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 541 540">
<g clipPath="url(#a)">
  <path fill="#F8F7FF" stroke="#E6E4FF" d="M1.03.5h539v539h-539z" />
  <path stroke="#E9E7FD" stroke-width="4" d="m270.52 1-3 538M539.52 270h-538" />
  <path stroke="#4609F0" stroke-opacity=".05" d="M.88.15 540.4 539.67M108.88.15 648.4 539.67M216.88.15 756.4 539.67M324.88.15 864.4 539.67M432.88.15 972.4 539.67M-431.12.15 108.4 539.67M-323.12.15 216.4 539.67M-215.12.15 324.4 539.67M-107.12.15 432.4 539.67M539.7.15.16 539.67M431.7.15l-539.53 539.52M323.7.15l-539.53 539.52M215.7.15l-539.53 539.52M107.7.15l-539.53 539.52M971.7.15 432.16 539.67M863.7.15 324.16 539.67M755.7.15 216.16 539.67M647.7.15 108.16 539.67" />
</g>
<path fill="#BDBAF6" fill-opacity=".22" d="M.53 0v-1h-1v1h1Zm540 0h1v-1h-1v1Zm0 540v1h1v-1h-1Zm-540 0h-1v1h1v-1Zm0-539h540v-2H.52v2Zm539-1v540h2V0h-2Zm1 539H.52v2h540v-2Zm-539 1V0h-2v540h2Z" />
<defs>
  <clipPath id="a">
    <path fill="#fff" d="M.53 0h540v540H.52V0Z" />
  </clipPath>
</defs>
</svg>
        `}
        />

        {/* AXES LABELS */}
        <AutoLayout x={20} y={580} width={540} height={20} spacing="auto">
          <Text
            fontSize={16}
            fontWeight={500}
            width="hug-contents"
            lineHeight={20}
            fill={"#819494"}
          >
            {scaleStart}
          </Text>
          <Text
            fontSize={16}
            fontWeight={500}
            width="hug-contents"
            lineHeight={20}
            fill={"#819494"}
          >
            {xAxisLabel}
          </Text>
          <Text
            fontSize={16}
            fontWeight={500}
            width="hug-contents"
            lineHeight={20}
            fill={"#819494"}
          >
            {scaleEnd}
          </Text>
        </AutoLayout>
        <AutoLayout
          x={0}
          y={580}
          width={540}
          height={20}
          spacing="auto"
          rotation={90}
        >
          <Text
            fontSize={16}
            fontWeight={500}
            width="hug-contents"
            lineHeight={20}
            fill={"#819494"}
          >
            {scaleStart}
          </Text>
          <Text
            fontSize={16}
            fontWeight={500}
            width="hug-contents"
            lineHeight={20}
            fill={"#819494"}
          >
            {yAxisLabel}
          </Text>
          <Text
            fontSize={16}
            fontWeight={500}
            width="hug-contents"
            lineHeight={20}
            fill={"#819494"}
          >
            {scaleEnd}
          </Text>
        </AutoLayout>

        {/* BUTTONS */}
        {pluginStatus === "setup" && (
          <AutoLayout
            direction="horizontal"
            horizontalAlignItems="center"
            verticalAlignItems="center"
            width={244}
            height={48}
            x={170}
            y={124}
            // fill="#107680"
            fill="#5E57A4"
            cornerRadius={6}
            onClick={async () => {
              await new Promise((resolve) => {
                showUI();
              });
            }}
          >
            <Text
              fontSize={16}
              fontWeight={500}
              width="hug-contents"
              lineHeight={20}
              fill={"#ffffff"}
            >
              Setup new prioritization
            </Text>
          </AutoLayout>
        )}

        {pluginStatus === "voting" && (
          <AutoLayout
            direction="horizontal"
            horizontalAlignItems="center"
            verticalAlignItems="center"
            width={244}
            height={48}
            x={170}
            y={124}
            fill="#5E57A4"
            cornerRadius={6}
            onClick={async () => {
              await new Promise((resolve) => {
                showUI();
              });
            }}
          >
            <Text
              fontSize={16}
              fontWeight={500}
              width="hug-contents"
              lineHeight={20}
              fill={"#ffffff"}
            >
              Add your ratings
            </Text>
          </AutoLayout>
        )}

        {pluginStatus === "voting" && (
          <AutoLayout
            direction="horizontal"
            horizontalAlignItems="center"
            verticalAlignItems="center"
            width={244}
            height={48}
            x={170}
            y={205}
            // fill="#F3FFFF"
            // stroke="#A4C5C5"
            fill="#EFEDFF"
            stroke="#5E57A4"
            cornerRadius={6}
            onClick={() => {
              setPluginStatus("revealed");
            }}
          >
            <Text
              fontSize={16}
              width="hug-contents"
              lineHeight={20}
              fill={"#332D73"}
            >
              Reveal results
            </Text>
          </AutoLayout>
        )}

        {/* photo dots when an idea is selected */}
        {selectedIdeaIndex >= 0 && userImages()}
        {selectedIdeaIndex >= 0 && dataPlot[selectedIdeaDotIndex] && (
          <AutoLayout
            verticalAlignItems="center"
            x={getX(dataPlot[selectedIdeaDotIndex].avgX) - 5}
            y={getY(dataPlot[selectedIdeaDotIndex].avgY) - 5}
            spacing={6}
          >
            <Ellipse
              y={4}
              width={10}
              height={10}
              fill="#108080"
              stroke="#fff"
            />
          </AutoLayout>
        )}

        {/* DATA DOTS */}
        {selectedIdeaIndex === -1 &&
          dataPlot.map((d, i) => (
            <AutoLayout
              key={d.letter}
              verticalAlignItems="center"
              x={getX(d.avgX) - 6}
              y={getY(d.avgY) - 10}
              spacing={6}
            >
              <Ellipse y={4} width={12} height={12} fill="#108080" />
              <Text
                fontSize={16}
                width="hug-contents"
                lineHeight={20}
                fill="#108080"
                fontWeight={500}
              >
                {d.letter}
              </Text>
            </AutoLayout>
          ))}
      </Frame>

      {pluginStatus === "revealed" && (
        <AutoLayout
          direction="vertical"
          spacing={0}
          width={"hug-contents"}
          height={"hug-contents"}
          padding={{ top: 60, left: 0 }}
        >
          {ideas.map((idea, i) => {
            const selected = i === selectedIdeaIndex;
            return (
              <AutoLayout
                key={i}
                height={"hug-contents"}
                width={"hug-contents"}
                spacing={8}
                fill={selected ? "#107680" : null}
                padding={{ left: 12, right: 10, top: 5, bottom: 6 }}
                cornerRadius={6}
                onClick={() => {
                  setSelectedIdeaIndex(selected ? -1 : i);
                }}
              >
                <Text
                  fontSize={16}
                  width={12}
                  horizontalAlignText="right"
                  lineHeight={20}
                  fill={selected ? "#fff" : "#108080"}
                  fontWeight={500}
                >
                  {numToLetter(i)}
                </Text>
                <Text
                  fontSize={16}
                  width={320}
                  lineHeight={20}
                  fill={selected ? "#fff" : "#272B2B"}
                  fontWeight={400}
                >
                  {idea.trim()}
                </Text>
                {selected && (
                  <SVG
                    src={`
<svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 14L11 6" stroke="white" stroke-width="1.2"/>
  <path d="M11 14L19 6" stroke="white" stroke-width="1.2"/>
</svg>
              `}
                  />
                )}
              </AutoLayout>
            );
          })}
        </AutoLayout>
      )}
    </AutoLayout>
  );
}
widget.register(Widget);
