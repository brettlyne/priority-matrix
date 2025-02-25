import React, { Fragment } from "react";
import { Logo, IconX } from "./util";

import Pagination from "./Pagination";

import "./App.scss";

type LikertPageProps = {
  idea: String;
  ideaIndex: number;
  xAxis: String;
  yAxis: String;
  xRating?: number;
  yRating?: number;
  handleYRating: Function;
  handleXRating: Function;
  scaleStart?: number;
  scaleEnd?: number;
};
const LikertPage = ({
  idea,
  ideaIndex,
  xAxis,
  yAxis,
  xRating,
  yRating,
  handleXRating,
  handleYRating,
  scaleStart = 1,
  scaleEnd = 5,
}: LikertPageProps) => {
  return (
    <div className="likert-page">
      <p className="idea-text">
        <span className="idea-number">{ideaIndex + 1}</span>
        {idea}
      </p>

      <div style={{ flex: 1 }}></div>

      <div>
        <p className="likert-heading">{xAxis}</p>
        <div className="likert">
          {[...Array(scaleEnd - scaleStart + 1)]
            .map((_, i) => scaleStart + i)
            .map((n) => (
              <Fragment key={`impact${ideaIndex}-${n}-x`}>
                <input
                  type="radio"
                  onChange={(e) => {
                    handleXRating(parseInt(e.target.value));
                  }}
                  id={`impact${ideaIndex}-${n}-x`}
                  name={`impact${ideaIndex}-x`}
                  value={n}
                  checked={n === xRating}
                />
                <label htmlFor={`impact${ideaIndex}-${n}-x`}>{n}</label>
              </Fragment>
            ))}
        </div>

        <div style={{ height: "20px" }}></div>

        <p className="likert-heading">{yAxis}</p>
        <div className="likert">
          {[...Array(scaleEnd - scaleStart + 1)]
            .map((_, i) => scaleStart + i)
            .map((n) => (
              <Fragment key={`impact${ideaIndex}-${n}-y`}>
                <input
                  type="radio"
                  onChange={(e) => {
                    handleYRating(parseInt(e.target.value));
                  }}
                  id={`impact${ideaIndex}-${n}-y`}
                  name={`impact${ideaIndex}-y`}
                  value={n}
                  checked={n === yRating}
                />
                <label htmlFor={`impact${ideaIndex}-${n}-y`}>{n}</label>
              </Fragment>
            ))}
        </div>
      </div>

      <div style={{ flex: 1 }}></div>
    </div>
  );
};

function App() {
  const [status, setStatus] = React.useState("setup");
  const [CSVData, setCSVData] = React.useState("");
  const textArea = React.useRef<HTMLTextAreaElement>(null);
  const [delimiter, setDelimiter] = React.useState("comma");
  const [userId, setUserId] = React.useState(null);
  const [userPhoto, setUserPhoto] = React.useState(null);
  const [ideas, setIdeas] = React.useState<string[]>([]);
  const [xAxis, setXAxis] = React.useState("Effort");
  const [yAxis, setYAxis] = React.useState("Impact");
  const [scaleStart, setScaleStart] = React.useState(1);
  const [scaleEnd, setScaleEnd] = React.useState(5);

  const [responsesByUser, setResponsesByUser] = React.useState<object>({});
  const [currentPage, setCurrentPage] = React.useState(0);

  const xAxisRef = React.useRef<HTMLInputElement>(null);
  const yAxisRef = React.useRef<HTMLInputElement>(null);

  const removeIdeaAt = (i: number) => {
    const newIdeas = [...ideas];
    newIdeas.splice(i, 1);
    setIdeas(newIdeas);
  };

  onmessage = (event) => {
    const message = JSON.parse(event.data.pluginMessage);
    if (message.msgType === "IMPORT") {
      const newIdeas = [...new Set([...ideas, ...message.ideas])];
      setIdeas(newIdeas);
    }
    if (message.msgType === "STATE") {
      setStatus(message.pluginStatus);
      setIdeas(message.ideas);
      setXAxis(message.xAxis);
      setYAxis(message.yAxis);
      setScaleStart(message.scaleStart);
      setScaleEnd(message.scaleEnd);
      setUserId(message.userId);
      setUserPhoto(message.userPhoto);
      setResponsesByUser(message.responsesByUser);
    }
    if (message.msgType === "OPEN_AS_CSV") {
      setStatus("csv");
      setCSVData(message.csvData);
    }
  };

  const startVoting = () => {
    if (scaleStart >= scaleEnd) {
      alert("Scale start must be less than scale end.");
      return;
    }
    if (
      isNaN(scaleStart) ||
      isNaN(scaleEnd) ||
      scaleStart % 1 !== 0 ||
      scaleEnd % 1 !== 0
    ) {
      alert("Scale start and scale end must be integers.");
      return;
    }
    const message = {
      msgType: "startVoting",
      xAxis: xAxisRef.current?.value || "Effort",
      yAxis: yAxisRef.current?.value || "Impact",
      scaleStart,
      scaleEnd,
      ideas,
    };
    parent?.postMessage?.({ pluginMessage: JSON.stringify(message) }, "*");
  };

  const initUserRecord = () => {
    let blankResponses = [];
    for (let i = 0; i < ideas.length; i++) {
      blankResponses.push({
        questionIdx: i,
        xRating: null,
        yRating: null,
      });
    }
    blankResponses = blankResponses.sort(() => Math.random() - 0.5); // shuffle array to randomize order
    setResponsesByUser({ userId, userPhoto, responses: blankResponses });
    parent?.postMessage?.(
      {
        pluginMessage: JSON.stringify({
          msgType: "newResponse",
          userId,
          userPhoto,
          responses: blankResponses,
        }),
      },
      "*"
    );
  };

  const addResponse = ({ responseIdx = 0, axis = "x", value = 0 }) => {
    if (
      currentPage < ideas.length - 1 &&
      responsesByUser.responses[responseIdx][`${axis}Rating`] === null &&
      responsesByUser.responses[responseIdx][
        `${axis === "x" ? "y" : "x"}Rating`
      ] !== null
    ) {
      setTimeout(() => {
        setCurrentPage(currentPage + 1);
      }, 700);
    }
    const newResponses = { ...responsesByUser };
    newResponses.responses[responseIdx][`${axis}Rating`] = value;
    setResponsesByUser(newResponses);
    parent?.postMessage?.(
      {
        pluginMessage: JSON.stringify({
          msgType: "addResponse",
          userId,
          responseIdx,
          axis,
          value,
        }),
      },
      "*"
    );
  };

  const userResponses = { ...responsesByUser };

  const noNullResponses =
    userResponses.responses &&
    userResponses.responses.reduce(
      (prev, curr) => curr.xRating !== null && curr.yRating !== null && prev,
      true
    );

  if (status === "csv") {
    let data = CSVData;
    if (delimiter === "tab") {
      data = data
        .split("\n")
        .map((line) => line.split(",").join("\t"))
        .join("\n");
    }

    return (
      <div className="App" style={{ padding: "4px 12px" }}>
        <div
          style={{
            margin: "10px 0",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span>Delimiter:</span>
          <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <input
              type="radio"
              name="delimiter"
              value="comma"
              checked={delimiter === "comma"}
              onChange={(e) => setDelimiter(e.target.value)}
            />
            commas
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <input
              type="radio"
              name="delimiter"
              value="tab"
              checked={delimiter === "tab"}
              onChange={(e) => setDelimiter(e.target.value)}
            />
            tabs (for sheets, excel, etc)
          </label>
        </div>
        <textarea
          style={{
            width: "100%",
            height: "calc(100% - 120px)",
            marginBottom: "12px",
          }}
          ref={textArea}
          readOnly
          value={data}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <button
            className="secondary"
            onClick={() => {
              textArea.current?.focus();
              textArea.current?.select();
              document.execCommand("copy");
            }}
          >
            Copy to clipboard
          </button>
          <button
            onClick={() => {
              parent.postMessage(
                {
                  pluginMessage: JSON.stringify({
                    msgType: "closePlugin",
                  }),
                },
                "*"
              );
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="App">
      {status === "setup" && (
        <div className="setup">
          <div className="settings">
            <Logo />

            <p>Select some stickies then click the button 👇</p>
            <div style={{ height: "12px" }}></div>
            <button
              className="secondary full-width"
              onClick={() => {
                parent?.postMessage?.(
                  {
                    pluginMessage: JSON.stringify({
                      msgType: "importSelectedIdeas",
                    }),
                  },
                  "*"
                );
              }}
            >
              Add selected stickies to prioritize
            </button>

            {ideas.length > 0 && (
              <>
                <div style={{ height: "24px" }}></div>
                {/* <div className="axes-names"> */}
                <p>Rate items on:</p>
                <div style={{ height: "8px" }}></div>

                <div className="axes-names">
                  <input
                    type="text"
                    name="xAxis"
                    id="xAxis"
                    defaultValue="Effort"
                    ref={xAxisRef}
                    placeholder="Effort"
                  />
                  <span>&</span>
                  <input
                    type="text"
                    name="yAxis"
                    id="yAxis"
                    defaultValue="Impact"
                    ref={yAxisRef}
                    placeholder="Impact"
                  />
                </div>

                <div style={{ height: "24px" }}></div>
                <button
                  className={`full-width ${
                    ideas.length === 0 ? "disabled" : ""
                  }`}
                  onClick={startVoting}
                >
                  Start voting
                </button>
                <p style={{ fontSize: "14px", marginTop: "8px" }}>
                  Participants will see items in randomized order.
                </p>
                <p style={{ fontSize: "14px", marginTop: "16px" }}>
                  Voting scale from&nbsp;
                  <input
                    key={scaleStart}
                    defaultValue={scaleStart}
                    onBlur={(e) => {
                      setScaleStart(
                        Math.max(-10, Math.min(10, parseInt(e.target.value)))
                      );
                    }}
                    type="number"
                    min="-10"
                    max="10"
                  />
                  &nbsp;to&nbsp;
                  <input
                    key={scaleEnd}
                    defaultValue={scaleEnd}
                    onBlur={(e) => {
                      setScaleEnd(
                        Math.max(-10, Math.min(10, parseInt(e.target.value)))
                      );
                    }}
                    type="number"
                    min="-10"
                    max="10"
                  />
                </p>
              </>
            )}
          </div>

          <div className="ideas-list">
            <p>Items to vote on:</p>
            <ul>
              {ideas.map((idea, i) => (
                <li key={idea}>
                  {idea}
                  <div className="delete-icon" onClick={() => removeIdeaAt(i)}>
                    <IconX />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {status !== "setup" && !userResponses.responses && (
        <>
          <div className="intro">
            <Logo />
            <p className="center">
              Rate each of the following ideas on <strong>{yAxis}</strong> and{" "}
              <strong>{xAxis}</strong>.
            </p>
            <p className="center">
              Ratings will be averaged across participants and <br />
              can then be revealed on the graph.
            </p>
            <button onClick={initUserRecord} className="big">
              Let's go!
            </button>
          </div>
        </>
      )}

      {status !== "setup" && userResponses.responses && (
        <Pagination
          showDoneButton={noNullResponses}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          pages={
            userResponses.responses &&
            userResponses.responses.map((response: object, i: number) => (
              <LikertPage
                key={i}
                idea={ideas[response.questionIdx]}
                ideaIndex={i}
                xAxis={xAxis}
                yAxis={yAxis}
                xRating={response.xRating}
                yRating={response.yRating}
                scaleStart={scaleStart}
                scaleEnd={scaleEnd}
                handleXRating={(value: number) => {
                  addResponse({
                    responseIdx: i,
                    axis: "x",
                    value,
                  });
                }}
                handleYRating={(value: number) => {
                  addResponse({
                    responseIdx: i,
                    axis: "y",
                    value,
                  });
                }}
              />
            ))
          }
          height={420}
        />
      )}
    </div>
  );
}

export default App;
