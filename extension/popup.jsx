import browser from 'webextension-polyfill'
import {render} from 'react-dom'
import {getPublicKey, nip19} from 'nostr-tools'
import React, {useState, useMemo, useRef, useEffect} from 'react'
import QRCode from 'react-qr-code'
import {SettingsIcon} from './icons'
import {minidenticon} from 'minidenticons'
import * as Tabs from '@radix-ui/react-tabs'

function Popup() {
  let [pubKey, setPubKey] = useState('')

  let keys = useRef({npub: '', hex: '', nprofile: ''})
  let avatarURI = useMemo(
    () =>
      pubKey
        ? 'data:image/svg+xml;utf8,' +
          encodeURIComponent(minidenticon(pubKey, 90, 30))
        : null,
    [pubKey]
  )

  const gotoSettings = () => {
    browser.tabs.create({
      url: browser.runtime.getURL('/options.html')
    })
  }

  useEffect(() => {
    browser.storage.local.get(['private_key', 'relays']).then(results => {
      if (results.private_key) {
        let hexKey = getPublicKey(results.private_key)
        let npubKey = nip19.npubEncode(hexKey)

        setPubKey(npubKey)

        keys.current.npub = npubKey
        keys.current.hex = hexKey

        if (results.relays) {
          let relaysList = []
          for (let url in results.relays) {
            if (results.relays[url].write) {
              relaysList.push(url)
              if (relaysList.length >= 3) break
            }
          }
          if (relaysList.length) {
            let nprofileKey = nip19.nprofileEncode({
              pubkey: hexKey,
              relays: relaysList
            })
            keys.current.nprofile = nprofileKey
          }
        }
      } else {
        setPubKey(null)
      }
    })
  }, [])

  return (
    <div className="w-[320px] p-6">
      {!pubKey ? (
        <div className="flex items-center justify-between gap-6">
          <div className="flex-1 flex items-center justify-between">
            <p className="text-sm font-medium">
              Click here to enter or create
              <br />
              your first identity
            </p>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </div>
          <button
            type="button"
            onClick={() => gotoSettings()}
            className="w-9 h-9 shrink-0 border border-primary shadow-sm rounded-xl inline-flex items-center justify-center"
          >
            <SettingsIcon className="w-5 h-5 text-muted" />
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {avatarURI ? (
                <img
                  src={avatarURI}
                  className="w-9 h-9 rounded-full bg-muted"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-muted" />
              )}
              <p className="font-semibold">Account</p>
            </div>
            <button
              type="button"
              onClick={() => gotoSettings()}
              className="w-9 h-9 shrink-0 border border-primary shadow-sm rounded-xl inline-flex items-center justify-center"
            >
              <SettingsIcon className="w-5 h-5 text-muted" />
            </button>
          </div>
          <div>
            <Tabs.Root defaultValue="npub">
              <Tabs.List className="w-full border-b border-primary h-10 flex items-center">
                <Tabs.Trigger
                  value="npub"
                  className="font-medium flex-1 flex items-center justify-center text-muted h-10 data-[state=active]:text-primary data-[state=active]:border-b data-[state=active]:border-secondary"
                >
                  npub
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="hex"
                  className="font-medium flex-1 flex items-center justify-center text-muted h-10 data-[state=active]:text-primary data-[state=active]:border-b data-[state=active]:border-secondary"
                >
                  hex
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="nprofile"
                  className="font-medium flex-1 flex items-center justify-center text-muted h-10 data-[state=active]:text-primary data-[state=active]:border-b data-[state=active]:border-secondary"
                >
                  naddr
                </Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="npub">
                <div className="my-4">
                  <textarea
                    readOnly
                    className="w-full h-20 resize-none p-3 bg-muted rounded-xl"
                  >
                    {pubKey}
                  </textarea>
                </div>
                <div className="w-full rounded-xl border border-primary p-4 flex items-center justify-center">
                  <QRCode
                    size={128}
                    value={
                      pubKey.startsWith('n') ? pubKey.toUpperCase() : pubKey
                    }
                  />
                </div>
              </Tabs.Content>
            </Tabs.Root>
          </div>
        </div>
      )}
    </div>
  )
}

render(<Popup />, document.getElementById('main'))
