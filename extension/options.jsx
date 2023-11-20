import browser from 'webextension-polyfill'
import React, {useState, useCallback, useEffect} from 'react'
import {render} from 'react-dom'
import {generatePrivateKey, nip19} from 'nostr-tools'
import QRCode from 'react-qr-code'
import * as Tabs from '@radix-ui/react-tabs'
import {Logo} from './icons'
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
    <div className="w-screen h-screen flex flex-col items-center justify-center">
      <div className="p-8 shadow-primary border border-primary rounded-2xl max-w-xl mx-auto flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Logo className="w-14 h-14" />
          <div>
            <h1 className="text-lg font-semibold">Nostr Connect</h1>
            <p className="text-sm text-muted font-medium">Nostr signer</p>
          </div>
        </div>
        <div className="flex flex-col">
          <div className="mb-4 flex flex-col gap-2">
            <div className="font-semibold text-base">Private key:</div>
            <div>
              <div className="flex gap-2">
                <input
                  type={hidingPrivateKey ? 'password' : 'text'}
                  value={privKey}
                  onChange={handleKeyChange}
                  className="flex-1 h-9 bg-transparent border border-primary px-3 py-1 rounded-lg"
                />
                <div className="shrink-0">
                  {!privKey && (
                    <button
                      type="button"
                      onClick={generate}
                      className="px-3 h-9 font-semibold border w-24 border-primary shadow-sm rounded-lg inline-flex items-center justify-center disabled:text-muted"
                    >
                      Generate
                    </button>
                  )}
                  {privKey && hidingPrivateKey && (
                    <button
                      type="button"
                      onClick={() => hidePrivateKey(false)}
                      className="px-3 h-9 font-bold border w-24 border-primary shadow-sm rounded-lg inline-flex items-center justify-center disabled:text-muted"
                    >
                      Show key
                    </button>
                  )}
                  {privKey && !hidingPrivateKey && (
                    <button
                      type="button"
                      onClick={() => hidePrivateKey(true)}
                      className="px-3 h-9 font-bold border w-24 border-primary shadow-sm rounded-lg inline-flex items-center justify-center disabled:text-muted"
                    >
                      Hide key
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-1 text-sm">
                {privKey && !isKeyValid() ? (
                  <p className="text-red-500">Private key is invalid!</p>
                ) : (
                  <p className="text-gray-500">
                    Your key is stored locally. The developer has no way of
                    seeing your keys.
                  </p>
                )}
              </div>
              {!hidingPrivateKey && isKeyValid() && (
                <div className="mt-5 flex flex-col items-center">
                  <QRCode
                    size={256}
                    value={privKey.toUpperCase()}
                    viewBox={`0 0 256 256`}
                    className="w-full max-w-full"
                  />
                </div>
              )}
            </div>
          </div>
          <Tabs.Root className="mb-4" defaultValue="relays">
            <Tabs.List
              className="mb-4 w-full border-b border-primary h-11 flex items-center gap-6"
              aria-label="Manage relay"
            >
              <Tabs.Trigger
                className="font-medium flex items-center text-muted gap-2 h-11 data-[state=active]:text-primary data-[state=active]:border-b data-[state=active]:border-secondary"
                value="relays"
              >
                Relays
                <span className="px-3 h-6 inline-flex items-center justify-center bg-muted data-[state=active]:text-primary rounded-full">
                  {relays.length}
                </span>
              </Tabs.Trigger>
              <Tabs.Trigger
                className="font-medium flex items-center text-muted gap-2 h-11 data-[state=active]:text-primary data-[state=active]:border-b data-[state=active]:border-secondary"
                value="permissions"
              >
                Permissions
                <span className="px-3 h-6 inline-flex items-center justify-center bg-muted data-[state=active]:text-primary rounded-full">
                  {policies.length}
                </span>
              </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="relays">
              <div className="flex flex-col gap-2">
                <div className="font-semibold text-base">Preferred Relays:</div>
                <div className="flex flex-col gap-2">
                  {relays.map(({url, policy}, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <input
                        value={url}
                        onChange={changeRelayURL.bind(null, i)}
                        className="flex-1 h-9 bg-transparent border px-3 py-1 border-primary rounded-lg placeholder:text-muted"
                      />
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-2 text-muted font-medium">
                          <input
                            type="checkbox"
                            checked={policy.read}
                            onChange={toggleRelayPolicy.bind(null, i, 'read')}
                          />
                          <p>Read</p>
                        </label>
                        <label className="inline-flex items-center gap-2 text-muted font-medium">
                          <input
                            type="checkbox"
                            checked={policy.write}
                            onChange={toggleRelayPolicy.bind(null, i, 'write')}
                          />
                          <p>Write</p>
                        </label>
                      </div>
                      <button
                        onClick={removeRelay.bind(null, i)}
                        className="shrink-0 px-3 w-24 h-9 font-semibold border border-primary shadow-sm rounded-lg inline-flex items-center justify-center disabled:text-muted"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      value={newRelayURL}
                      onChange={e => setNewRelayURL(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') addNewRelay()
                      }}
                      placeholder="wss://"
                      className="flex-1 h-9 bg-transparent border px-3 py-1 border-primary rounded-lg placeholder:text-muted"
                    />
                    <button
                      disabled={!newRelayURL}
                      onClick={addNewRelay}
                      className="shrink-0 px-3 w-24 h-9 font-semibold border border-primary shadow-sm rounded-lg inline-flex items-center justify-center disabled:text-muted"
                    >
                      Add Relay
                    </button>
                  </div>
                </div>
              </div>
            </Tabs.Content>
            <Tabs.Content value="permissions">
              <div className="flex flex-col gap-2">
                <div className="font-semibold text-base">Permissions:</div>
                {!policies.length ? (
                  <div className="text-muted">
                    You haven't granted any permissions to any apps yet
                  </div>
                ) : (
                  <table className="table-auto">
                    <thead>
                      <tr className="mb-2">
                        <th className="text-left border-b-8 border-transparent">
                          Domain
                        </th>
                        <th className="text-left border-b-8 border-transparent">
                          Permission
                        </th>
                        <th className="text-left border-b-8 border-transparent">
                          Answer
                        </th>
                        <th className="text-left border-b-8 border-transparent">
                          Conditions
                        </th>
                        <th className="text-left border-b-8 border-transparent">
                          Since
                        </th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {policies.map(
                        ({host, type, accept, conditions, created_at}) => (
                          <tr
                            key={
                              host + type + accept + JSON.stringify(conditions)
                            }
                          >
                            <td className="font-semibold">{host}</td>
                            <td className="text-muted">{type}</td>
                            <td className="text-muted">
                              {accept === 'true' ? 'allow' : 'deny'}
                            </td>
                            <td className="text-muted">
                              {conditions.kinds
                                ? `kinds: ${Object.keys(conditions.kinds).join(
                                    ', '
                                  )}`
                                : 'always'}
                            </td>
                            <td className="text-muted">
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
                                className="text-primary font-semibold"
                              >
                                Revoke
                              </button>
                            </td>
                          </tr>
                        )
                      )}
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
                )}
              </div>
            </Tabs.Content>
          </Tabs.Root>
          <div className="mb-3">
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
          <div>
            <details>
              <summary className="flex items-center justify-between">
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
              </summary>
              <div className="mt-3">
                <label className="flex gap-2 items-center">
                  <input
                    type="checkbox"
                    checked={handleNostrLinks}
                    onChange={changeHandleNostrLinks}
                    className="w-6 h-6 rounded-md border border-gray-200 dark:border-gray-800 appearance-none"
                  />
                  Handle nostr links
                </label>
              </div>
            </details>
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
        <button
          disabled={!unsavedChanges.length}
          onClick={saveChanges}
          className="w-full h-10 bg-primary rounded-xl font-bold inline-flex items-center justify-center text-white disabled:cursor-not-allowed"
        >
          Save
        </button>
      </div>
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
