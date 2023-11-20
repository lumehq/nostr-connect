import browser from 'webextension-polyfill'
import React, {useState, useCallback, useEffect} from 'react'
import {render} from 'react-dom'
import {generatePrivateKey, nip19} from 'nostr-tools'
import QRCode from 'react-qr-code'

import {removePermissions} from './common'

function Options() {
  let [privKey, setPrivKey] = useState('')
  let [relays, setRelays] = useState([])
  let [newRelayURL, setNewRelayURL] = useState('')
  let [policies, setPermissions] = useState([])
  let [protocolHandler, setProtocolHandler] = useState('https://njump.me/{raw}')
  let [hidingPrivateKey, hidePrivateKey] = useState(true)
  let [showNotifications, setNotifications] = useState(false)
  let [messages, setMessages] = useState([])
  let [handleNostrLinks, setHandleNostrLinks] = useState(false)
  let [showProtocolHandlerHelp, setShowProtocolHandlerHelp] = useState(false)
  let [unsavedChanges, setUnsavedChanges] = useState([])

  const showMessage = useCallback(msg => {
    messages.push(msg)
    setMessages(messages)
    setTimeout(() => setMessages([]), 3000)
  })

  useEffect(() => {
    browser.storage.local
      .get(['private_key', 'relays', 'protocol_handler', 'notifications'])
      .then(results => {
        if (results.private_key) {
          setPrivKey(nip19.nsecEncode(results.private_key))
        }
        if (results.relays) {
          let relaysList = []
          for (let url in results.relays) {
            relaysList.push({
              url,
              policy: results.relays[url]
            })
          }
          setRelays(relaysList)
        }
        if (results.protocol_handler) {
          setProtocolHandler(results.protocol_handler)
          setHandleNostrLinks(true)
          setShowProtocolHandlerHelp(false)
        }
        if (results.notifications) {
          setNotifications(true)
        }
      })
  }, [])

  useEffect(() => {
    loadPermissions()
  }, [])

  async function loadPermissions() {
    let {policies = {}} = await browser.storage.local.get('policies')
    let list = []

    Object.entries(policies).forEach(([host, accepts]) => {
      Object.entries(accepts).forEach(([accept, types]) => {
        Object.entries(types).forEach(([type, {conditions, created_at}]) => {
          list.push({
            host,
            type,
            accept,
            conditions,
            created_at
          })
        })
      })
    })

    setPermissions(list)
  }

  return (
    <div className="mt-10 p-8 bg-white dark:bg-black border border-gray-100 dark:border-gray-900 rounded-2xl max-w-xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        <div>
          <h1 className="text-lg font-bold">Nostr Connect</h1>
          <p className="text-base text-gray-500 font-medium">Nostr signer</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col">
        <div className="mb-6 flex flex-col gap-2">
          <div className="font-semibold text-base">Private key:</div>
          <div>
            <div className="flex gap-2">
              <input
                type={hidingPrivateKey ? 'password' : 'text'}
                value={privKey}
                onChange={handleKeyChange}
                className="flex-1 h-9 bg-transparent border px-3 py-1 border-gray-200 dark:border-gray-800 rounded-lg"
              />
              <div className="shrink-0">
                {!privKey && (
                  <button
                    onClick={generate}
                    className="px-3 h-9 font-bold border border-gray-200 shadow-sm dark:border-gray-800 rounded-lg inline-flex items-center justify-center"
                  >
                    Generate
                  </button>
                )}
                {privKey && hidingPrivateKey && (
                  <button onClick={() => hidePrivateKey(false)}>
                    Show key
                  </button>
                )}
                {privKey && !hidingPrivateKey && (
                  <button onClick={() => hidePrivateKey(true)}>Hide key</button>
                )}
              </div>
            </div>
            <p className="text-gray-500 text-sm mt-1">
              Your key is stored locally. The developer has no way of seeing
              your keys.
            </p>
            {privKey && !isKeyValid() && (
              <div style={{color: 'red'}}>private key is invalid!</div>
            )}
            {!hidingPrivateKey && isKeyValid() && (
              <div
                style={{
                  height: 'auto',
                  maxWidth: 256,
                  width: '100%',
                  marginTop: '5px'
                }}
              >
                <QRCode
                  size={256}
                  style={{height: 'auto', maxWidth: '100%', width: '100%'}}
                  value={privKey.toUpperCase()}
                  viewBox={`0 0 256 256`}
                />
              </div>
            )}
          </div>
        </div>
        <div className="mb-4 flex flex-col">
          <div className="mb-4 w-full border-b border-gray-100 h-11 flex items-center gap-6">
            <div className="text-indigo-600 font-medium flex gap-2 items-center h-11 border-b border-indigo-600">
              Relays
              <span className="px-3 h-6 inline-flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-full">
                10
              </span>
            </div>
            <div className="text-gray-300 font-medium flex items-center gap-2 h-11">
              Permissions
              <span className="px-3 h-6 inline-flex items-center justify-center bg-gray-100 rounded-full">
                0
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="font-semibold text-base">Preferred Relays:</div>
            <div>
              {relays.map(({url, policy}, i) => (
                <div
                  key={i}
                  style={{display: 'flex', alignItems: 'center', gap: '15px'}}
                >
                  <input
                    style={{width: '400px'}}
                    value={url}
                    onChange={changeRelayURL.bind(null, i)}
                  />
                  <div style={{display: 'flex', gap: '5px'}}>
                    <label style={{display: 'flex', alignItems: 'center'}}>
                      read
                      <input
                        type="checkbox"
                        checked={policy.read}
                        onChange={toggleRelayPolicy.bind(null, i, 'read')}
                      />
                    </label>
                    <label style={{display: 'flex', alignItems: 'center'}}>
                      write
                      <input
                        type="checkbox"
                        checked={policy.write}
                        onChange={toggleRelayPolicy.bind(null, i, 'write')}
                      />
                    </label>
                  </div>
                  <button onClick={removeRelay.bind(null, i)}>remove</button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  style={{width: '400px'}}
                  value={newRelayURL}
                  onChange={e => setNewRelayURL(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') addNewRelay()
                  }}
                  className="flex-1 h-9 bg-transparent border px-3 py-1 border-gray-200 dark:border-gray-800 rounded-lg"
                />
                <button
                  disabled={!newRelayURL}
                  onClick={addNewRelay}
                  className="shrink-0 px-3 h-9 font-bold border border-gray-200 shadow-sm dark:border-gray-800 rounded-lg inline-flex items-center justify-center disabled:text-gray-300"
                >
                  Add Relay
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="mb-6">
          <label className="flex gap-2 items-center">
            <input
              type="checkbox"
              checked={showNotifications}
              onChange={handleNotifications}
              className="w-6 h-6 rounded-md border border-gray-200 dark:border-gray-800 appearance-none"
            />
            Show desktop notifications when a permissions has been used
          </label>
        </div>
        <div className="mb-4 flex items-center justify-between">
          <div className="font-semibold text-base">Advanced</div>
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </div>
        </div>
        {/*<div>
          <label style={{display: 'flex', alignItems: 'center'}}>
            <div>
              handle{' '}
              <span style={{padding: '2px', background: 'silver'}}>nostr:</span>{' '}
              links:
            </div>
            <input
              type="checkbox"
              checked={handleNostrLinks}
              onChange={changeHandleNostrLinks}
            />
          </label>
          <div style={{marginLeft: '10px'}}>
            {handleNostrLinks && (
              <div>
                <div style={{display: 'flex'}}>
                  <input
                    placeholder="url template"
                    value={protocolHandler}
                    onChange={handleChangeProtocolHandler}
                    style={{width: '680px', maxWidth: '90%'}}
                  />
                  {!showProtocolHandlerHelp && (
                    <button onClick={changeShowProtocolHandlerHelp}>?</button>
                  )}
                </div>
                {showProtocolHandlerHelp && (
                  <pre>{`
    {raw} = anything after the colon, i.e. the full nip19 bech32 string
    {hex} = hex pubkey for npub or nprofile, hex event id for note or nevent
    {p_or_e} = "p" for npub or nprofile, "e" for note or nevent
    {u_or_n} = "u" for npub or nprofile, "n" for note or nevent
    {relay0} = first relay in a nprofile or nevent
    {relay1} = second relay in a nprofile or nevent
    {relay2} = third relay in a nprofile or nevent
    {hrp} = human-readable prefix of the nip19 string

    examples:
      - https://njump.me/{raw}
      - https://snort.social/{raw}
      - https://nostr.band/{raw}
                `}</pre>
                )}
              </div>
            )}
          </div>
        </div>*/}
        {/*<div style={{fontSize: '120%'}}>
          {messages.map((message, i) => (
            <div key={i}>{message}</div>
          ))}
        </div>*/}
      </div>
      {/*<div>
        <h2>permissions</h2>
        <table>
          <thead>
            <tr>
              <th>domain</th>
              <th>permission</th>
              <th>answer</th>
              <th>conditions</th>
              <th>since</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {policies.map(({host, type, accept, conditions, created_at}) => (
              <tr key={host + type + accept + JSON.stringify(conditions)}>
                <td>{host}</td>
                <td>{type}</td>
                <td>{accept === 'true' ? 'allow' : 'deny'}</td>
                <td>
                  {conditions.kinds
                    ? `kinds: ${Object.keys(conditions.kinds).join(', ')}`
                    : 'always'}
                </td>
                <td>
                  {new Date(created_at * 1000)
                    .toISOString()
                    .split('.')[0]
                    .split('T')
                    .join(' ')}
                </td>
                <td>
                  <button
                    onClick={handleRevoke}
                    data-host={host}
                    data-accept={accept}
                    data-type={type}
                  >
                    revoke
                  </button>
                </td>
              </tr>
            ))}
            {!policies.length && (
              <tr>
                {Array(5)
                  .fill('N/A')
                  .map((v, i) => (
                    <td key={i}>{v}</td>
                  ))}
              </tr>
            )}
          </tbody>
        </table>
        {!policies.length && (
          <div style={{marginTop: '5px'}}>
            no permissions have been granted yet
          </div>
        )}
        </div>*/}
      <button
        disabled={!unsavedChanges.length}
        onClick={saveChanges}
        className="w-full h-10 bg-indigo-600 rounded-xl font-bold inline-flex items-center justify-center text-white"
      >
        Save
      </button>
    </div>
  )

  async function handleKeyChange(e) {
    let key = e.target.value.toLowerCase().trim()
    setPrivKey(key)
    addUnsavedChanges('private_key')
  }

  async function generate() {
    setPrivKey(nip19.nsecEncode(generatePrivateKey()))
    addUnsavedChanges('private_key')
  }

  async function saveKey() {
    if (!isKeyValid()) {
      showMessage('PRIVATE KEY IS INVALID! did not save private key.')
      return
    }

    let hexOrEmptyKey = privKey

    try {
      let {type, data} = nip19.decode(privKey)
      if (type === 'nsec') hexOrEmptyKey = data
    } catch (_) {}

    await browser.storage.local.set({
      private_key: hexOrEmptyKey
    })

    if (hexOrEmptyKey !== '') {
      setPrivKey(nip19.nsecEncode(hexOrEmptyKey))
    }

    showMessage('saved private key!')
  }

  function isKeyValid() {
    if (privKey === '') return true
    if (privKey.match(/^[a-f0-9]{64}$/)) return true
    try {
      if (nip19.decode(privKey).type === 'nsec') return true
    } catch (_) {}
    return false
  }

  function changeRelayURL(i, ev) {
    setRelays([
      ...relays.slice(0, i),
      {url: ev.target.value, policy: relays[i].policy},
      ...relays.slice(i + 1)
    ])
    addUnsavedChanges('relays')
  }

  function toggleRelayPolicy(i, cat) {
    setRelays([
      ...relays.slice(0, i),
      {
        url: relays[i].url,
        policy: {...relays[i].policy, [cat]: !relays[i].policy[cat]}
      },
      ...relays.slice(i + 1)
    ])
    addUnsavedChanges('relays')
  }

  function removeRelay(i) {
    setRelays([...relays.slice(0, i), ...relays.slice(i + 1)])
    addUnsavedChanges('relays')
  }

  function addNewRelay() {
    if (newRelayURL.trim() === '') return
    relays.push({
      url: newRelayURL,
      policy: {read: true, write: true}
    })
    setRelays(relays)
    addUnsavedChanges('relays')
    setNewRelayURL('')
  }

  async function handleRevoke(e) {
    let {host, accept, type} = e.target.dataset
    if (
      window.confirm(
        `revoke all ${
          accept === 'true' ? 'accept' : 'deny'
        } ${type} policies from ${host}?`
      )
    ) {
      await removePermissions(host, accept, type)
      showMessage('removed policies')
      loadPermissions()
    }
  }

  function handleNotifications() {
    setNotifications(!showNotifications)
    addUnsavedChanges('notifications')
    if (!showNotifications) requestBrowserNotificationPermissions()
  }

  async function requestBrowserNotificationPermissions() {
    let granted = await browser.permissions.request({
      permissions: ['notifications']
    })
    if (!granted) setNotifications(false)
  }

  async function saveNotifications() {
    await browser.storage.local.set({notifications: showNotifications})
    showMessage('saved notifications!')
  }

  async function saveRelays() {
    await browser.storage.local.set({
      relays: Object.fromEntries(
        relays
          .filter(({url}) => url.trim() !== '')
          .map(({url, policy}) => [url.trim(), policy])
      )
    })
    showMessage('saved relays!')
  }

  function changeShowProtocolHandlerHelp() {
    setShowProtocolHandlerHelp(true)
  }

  function changeHandleNostrLinks() {
    if (handleNostrLinks) {
      setProtocolHandler('')
      addUnsavedChanges('protocol_handler')
    } else setShowProtocolHandlerHelp(true)
    setHandleNostrLinks(!handleNostrLinks)
  }

  function handleChangeProtocolHandler(e) {
    setProtocolHandler(e.target.value)
    addUnsavedChanges('protocol_handler')
  }

  async function saveNostrProtocolHandlerSettings() {
    await browser.storage.local.set({protocol_handler: protocolHandler})
    showMessage('saved protocol handler!')
  }

  function addUnsavedChanges(section) {
    if (!unsavedChanges.find(s => s === section)) {
      unsavedChanges.push(section)
      setUnsavedChanges(unsavedChanges)
    }
  }

  async function saveChanges() {
    for (let section of unsavedChanges) {
      switch (section) {
        case 'private_key':
          await saveKey()
          break
        case 'relays':
          await saveRelays()
          break
        case 'protocol_handler':
          await saveNostrProtocolHandlerSettings()
          break
        case 'notifications':
          await saveNotifications()
          break
      }
    }
    setUnsavedChanges([])
  }
}

render(<Options />, document.getElementById('main'))
