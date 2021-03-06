import React, { Fragment, useEffect } from 'react'
import Pagination from './Pagination'

import './App.scss'

const Logo = () => <svg className="logo" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 260 28" width="260px" height="28px">
  <path fill="#385959" d="M12 0h236v28H12zM256 8h4v4h-4zM252 4h4v4h-4zM248 0h4v4h-4zM256 16h4v4h-4zM252 12h4v4h-4zM248 4h4v8h-4zM256 24h4v4h-4zM252 20h4v4h-4zM248 16h4v4h-4z" />
  <path fill="#fff" d="M28 16h-4v8h-4V4h12.1v4h-8v4h4v4Zm.1-8h4v8h-4V8ZM36.6 4h12v4h-8v4h4v4h4v8h-4v-8h-4v8h-4V4Zm8 4h4v4h-4V8ZM53.1 4h4v20h-4V4ZM61.7 4h4v20h-4V4Zm4 0h8v20h-8v-4h4V8h-4V4ZM78.3 4h12v4h-8v4h4v4h4v8h-4v-8h-4v8h-4V4Zm8 4h4v4h-4V8ZM94.8 4h4v20h-4V4ZM103.3 4h12v4h-4v16h-4V8h-4V4ZM119.9 4h3.9v8h4V4h4v12h-4v8h-4v-8h-4V4ZM145 4h4v4h4v4h4V8h4V4h4v20h-4V12h-4v4h-4v-4h-4v12h-4V4ZM169.5 4h12v20h-4V8h-4v16h-4V4Zm4 8h4v4h-4v-4ZM186 4h12v4h-4v16h-3.9V8h-4V4ZM202.7 4h12v4h-8v4h4v4h4v8h-4v-8h-4v8h-4V4Zm8 4h4v4h-4V8ZM219.2 4h4v20h-4V4ZM227.8 4h4v8h4V4h4v8h-4v4h4v8h-4v-8h-4v8h-4v-8h4v-4h-4V4Z" />
  <path fill="#385959" d="M4 0H0v4h4zM8 4H4v4h4zM12 8H8v4h4zM4 8H0v4h4zM8 12H4v4h4zM12 16H8v9h4zM4 16H0v4h4zM8 20H4v4h4z" />
  <path fill="#385959" d="M12 24H8v4h4z" />
</svg>

const IconX = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" width="20px" height="20px">
  <circle cx="10" cy="10" r="10" fill="#FF8989" />
  <path stroke="#fff" strokeWidth="2" d="m6 6 8 8M14 6l-8 8" />
</svg>


type LikertPageProps = {
  idea: String,
  ideaIndex: number,
  xAxis: String,
  yAxis: String,
  xRating?: number,
  yRating?: number,
  handleYRating: Function,
  handleXRating: Function
};
const LikertPage = ({ idea, ideaIndex, xAxis, yAxis, xRating, yRating, handleXRating, handleYRating }: LikertPageProps) => {
  return <div className="likert-page">

    <p className="idea-text">
      <span className="idea-number">{ideaIndex + 1}</span>
      {idea}
    </p>

    <div style={{ flex: 1 }}></div>

    <div>
      <p className="likert-heading">{xAxis}</p>
      <div className="likert">
        {[1, 2, 3, 4, 5].map(n => <Fragment key={`impact${ideaIndex}-${n}-x`}>
          <input
            type="radio"
            onChange={e => { handleXRating(parseInt(e.target.value)) }}
            id={`impact${ideaIndex}-${n}-x`}
            name={`impact${ideaIndex}-x`}
            value={n}
            checked={n === xRating}
          />
          <label htmlFor={`impact${ideaIndex}-${n}-x`}>{n}</label>
        </Fragment>
        )}
      </div>

      <div style={{ height: '20px' }}></div>

      <p className="likert-heading">{yAxis}</p>
      <div className="likert">

        {[1, 2, 3, 4, 5].map(n => <Fragment key={`impact${ideaIndex}-${n}-y`}>
          <input
            type="radio"
            onChange={e => { handleYRating(parseInt(e.target.value)) }}
            id={`impact${ideaIndex}-${n}-y`}
            name={`impact${ideaIndex}-y`}
            value={n}
            checked={n === yRating}
          />
          <label htmlFor={`impact${ideaIndex}-${n}-y`}>{n}</label>
        </Fragment>
        )}
      </div>
    </div>

    <div style={{ flex: 1 }}></div>

  </div>
}


function App() {

  const [status, setStatus] = React.useState("setup");
  const [userId, setUserId] = React.useState(null);
  const [userPhoto, setUserPhoto] = React.useState(null);
  const [ideas, setIdeas] = React.useState<string[]>([]);
  const [xAxis, setXAxis] = React.useState('Effort')
  const [yAxis, setYAxis] = React.useState('Impact')
  const [responsesByUser, setResponsesByUser] = React.useState<object>({})
  const [currentPage, setCurrentPage] = React.useState(0);

  const xAxisRef = React.useRef<HTMLInputElement>(null);
  const yAxisRef = React.useRef<HTMLInputElement>(null);

  const removeIdeaAt = (i: number) => {
    const newIdeas = [...ideas]
    newIdeas.splice(i, 1)
    setIdeas(newIdeas)
  }

  onmessage = (event) => {
    const message = JSON.parse(event.data.pluginMessage);
    if (message.msgType === "IMPORT") {
      const newIdeas = [...new Set([...ideas, ...message.ideas])]
      setIdeas(newIdeas);
    }
    if (message.msgType === "STATE") {
      setStatus(message.pluginStatus)
      setIdeas(message.ideas)
      setXAxis(message.xAxis)
      setYAxis(message.yAxis)
      setUserId(message.userId)
      setUserPhoto(message.userPhoto)
      setResponsesByUser(message.responsesByUser)
    }
  }

  const startVoting = () => {
    const message = {
      msgType: 'startVoting',
      xAxis: xAxisRef.current?.value || "Effort",
      yAxis: yAxisRef.current?.value || "Impact",
      ideas
    }
    parent?.postMessage?.({ pluginMessage: JSON.stringify(message) }, '*')
  }

  const initUserRecord = () => {
    let blankResponses = [];
    for (let i = 0; i < ideas.length; i++) {
      blankResponses.push({
        questionIdx: i,
        xRating: null,
        yRating: null,
      })
    }
    blankResponses = blankResponses.sort(() => Math.random() - 0.5) // shuffle array to randomize order
    setResponsesByUser({ userId, userPhoto, responses: blankResponses })
    parent?.postMessage?.({
      pluginMessage: JSON.stringify({
        msgType: 'newResponse',
        userId,
        userPhoto,
        responses: blankResponses
      })
    }, '*')
  }

  const addResponse = ({ responseIdx = 0, axis = 'x', value = 0 }) => {
    if (
      currentPage < ideas.length - 1 &&
      responsesByUser.responses[responseIdx][`${axis}Rating`] === null &&
      responsesByUser.responses[responseIdx][`${axis === 'x' ? 'y' : 'x'}Rating`] !== null
    ) {
      setTimeout(() => {
        setCurrentPage(currentPage + 1)
      }, 700);
    }
    const newResponses = { ...responsesByUser }
    newResponses.responses[responseIdx][`${axis}Rating`] = value
    setResponsesByUser(newResponses)
    parent?.postMessage?.({
      pluginMessage: JSON.stringify(
        { msgType: 'addResponse', userId, responseIdx, axis, value }
      )
    }, '*')
  }

  const userResponses = { ...responsesByUser }

  const noNullResponses = userResponses.responses && userResponses.responses.reduce(
    (prev, curr) => curr.xRating !== null && curr.yRating !== null && prev,
    true
  )

  return (
    <div className="App">

      {status === "setup" && (
        <div className="setup">
          <div className="settings">
            <Logo />

            <p>Select some stickies then click the button ????</p>
            <div style={{ height: '12px' }}></div>
            <button
              className="secondary full-width"
              onClick={() => { parent?.postMessage?.({ pluginMessage: JSON.stringify({ msgType: 'importSelectedIdeas' }) }, '*') }}>
              Add selected stickies to prioritize
            </button>

            {ideas.length > 0 && <>
              <div style={{ height: '24px' }}></div>
              {/* <div className="axes-names"> */}
              <p>Rate items on:</p>
              <div style={{ height: '8px' }}></div>

              <div className="axes-names">
                <input type="text" name="xAxis" id="xAxis" defaultValue="Effort" ref={xAxisRef} placeholder='Effort' />
                <span>&</span>
                <input type="text" name="yAxis" id="yAxis" defaultValue="Impact" ref={yAxisRef} placeholder='Impact' />
              </div>

              <div style={{ height: '40px' }}></div>
              <button className={`full-width ${ideas.length === 0 ? 'disabled' : ''}`} onClick={startVoting}>Start voting</button>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>Participants will see items in randomized order.</p>
            </>}
          </div>


          <div className="ideas-list">
            <p>Items to vote on:</p>
            <ul>
              {ideas.map((idea, i) => <li key={idea}>
                {idea}
                <div
                  className="delete-icon"
                  onClick={() => removeIdeaAt(i)}
                ><IconX />
                </div>
              </li>)}
            </ul>
          </div>

        </div>
      )}

      {status !== "setup" && !userResponses.responses && (<>
        <div className="intro">
          <Logo />
          <p className="center">
            Rate each of the following ideas on <strong>{yAxis}</strong> and <strong>{xAxis}</strong>.
          </p>
          <p className="center">
            Ratings will be averaged across participants and <br />can then be revealed on the graph.
          </p>
          <button onClick={initUserRecord} className="big">Let's go!</button>
        </div>
      </>
      )}

      {status !== "setup" && userResponses.responses && (
        <Pagination
          showDoneButton={noNullResponses}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          pages={userResponses.responses && userResponses.responses.map((response: object, i: number) => (
            <LikertPage
              key={i}
              idea={ideas[response.questionIdx]}
              ideaIndex={i}
              xAxis={xAxis}
              yAxis={yAxis}
              xRating={response.xRating}
              yRating={response.yRating}
              handleXRating={(value: number) => {
                addResponse({
                  responseIdx: i,
                  axis: 'x',
                  value
                })
              }}
              handleYRating={(value: number) => {
                addResponse({
                  responseIdx: i,
                  axis: 'y',
                  value
                })
              }}
            />
          ))}
          height={420}
        />
      )}



    </div>
  )
}

export default App
