import browser from 'webextension-polyfill'
import {render} from 'react-dom'
import React, {useState} from 'react'

import {PERMISSION_NAMES} from './common'
import {LogoIcon} from './icons'
import * as Checkbox from '@radix-ui/react-checkbox'

function Prompt() {
  const [isRemember, setIsRemember] = useState(false)

  let qs = new URLSearchParams(location.search)
  let id = qs.get('id')
  let host = qs.get('host')
  let type = qs.get('type')
  let params, event

  try {
    params = JSON.parse(qs.get('params'))
    if (Object.keys(params).length === 0) params = null
    else if (params.event) event = params.event
  } catch (err) {
    params = null
  }

  function authorizeHandler(accept) {
    const conditions = isRemember ? {} : null
    return function (ev) {
      ev.preventDefault()
      browser.runtime.sendMessage({
        prompt: true,
        id,
        host,
        type,
        accept,
        conditions
      })
    }
  }

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center">
      <div className="p-8 shadow-primary border border-primary rounded-2xl max-w-xl mx-auto flex flex-col gap-5">
        <div className="flex flex-col items-center gap-5">
          <LogoIcon />
          <div className="flex flex-col items-center text-center">
            <h1 className="font-semibold text-lg">{host}</h1>
            <p>
              is requesting your permission to <b>{PERMISSION_NAMES[type]}</b>
            </p>
          </div>
        </div>
        {params && (
          <div>
            <p>Now acting on</p>
            <pre className="bg-muted rounded-xl p-3">
              <code>{JSON.stringify(event || params, null, 2)}</code>
            </pre>
          </div>
        )}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-center gap-2">
            <Checkbox.Root
              id="remember"
              className="flex h-6 w-6 appearance-none items-center justify-center rounded-lg bg-white outline-none border border-primary data-[state=checked]:bg-primary data-[state=checked]:border-secondary"
              onCheckedChange={setIsRemember}
            >
              <Checkbox.Indicator className="text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </Checkbox.Indicator>
            </Checkbox.Root>
            <label htmlFor="remember" className="text-muted">
              Remember my preference forever
            </label>
          </div>
          <div className="flex gap-3">
            <button
              onClick={authorizeHandler(false)}
              className="flex-1 h-10 rounded-lg shadow-sm border border-primary inline-flex items-center justify-center font-semibold"
            >
              Reject
            </button>
            <button
              onClick={authorizeHandler(true)}
              className="flex-1 h-10 rounded-lg shadow-sm border border-secondary bg-primary text-white inline-flex items-center justify-center font-semibold"
            >
              Authorize
            </button>
          </div>
        </div>
        {/*
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-around'
          }}
        >
          <button
            style={{marginTop: '5px'}}
            onClick={authorizeHandler(
              true,
              {} // store this and answer true forever
            )}
          >
            authorize forever
          </button>
          {event?.kind !== undefined && (
            <button
              style={{marginTop: '5px'}}
              onClick={authorizeHandler(
                true,
                {kinds: {[event.kind]: true}} // store and always answer true for all events that match this condition
              )}
            >
              authorize kind {event.kind} forever
            </button>
          )}
          <button style={{marginTop: '5px'}} onClick={authorizeHandler(true)}>
            authorize just this
          </button>
          {event?.kind !== undefined ? (
            <button
              style={{marginTop: '5px'}}
              onClick={authorizeHandler(
                false,
                {kinds: {[event.kind]: true}} // idem
              )}
            >
              reject kind {event.kind} forever
            </button>
          ) : (
            <button
              style={{marginTop: '5px'}}
              onClick={authorizeHandler(
                false,
                {} // idem
              )}
            >
              reject forever
            </button>
          )}
          <button style={{marginTop: '5px'}} onClick={authorizeHandler(false)}>
            reject
          </button>
        </div>*/}
      </div>
    </div>
  )
}

render(<Prompt />, document.getElementById('main'))
