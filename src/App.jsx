import { useEffect, useState } from 'react'
import { Connection, PublicKey, Keypair, Transaction } from '@solana/web3.js'
import {
  getAssociatedTokenAddressSync,
  createTransferInstruction,
  getAccount,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token'
import { Buffer } from 'buffer'
import Blockies from 'react-blockies'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import logo from '/Logo.jpg'

window.Buffer = Buffer

const RPC_URL = 'https://api.devnet.solana.com'
const LIKE_MINT = new PublicKey('3Nx5eK8sZd8Sqa6fVqkwEP3j9Dt2PwkqctGBYHTaeyQT')

function App() {
  const [wallet, setWallet] = useState(null)
  const [likeBalance, setLikeBalance] = useState(null)
  const [sending, setSending] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [connected, setConnected] = useState(false)
  const [theme, setTheme] = useState('dark')
  const [searchQuery, setSearchQuery] = useState('')
  const [twitterHandle, setTwitterHandle] = useState(null)
  const [showWallet, setShowWallet] = useState(true)

  useEffect(() => {
    document.body.style.backgroundColor = theme === 'dark' ? '#111' : '#fff'
    document.body.style.color = theme === 'dark' ? '#fff' : '#000'
  }, [theme])

  useEffect(() => {
    const checkWalletAndFetchBalance = async () => {
      if ('solana' in window) {
        const provider = window.solana
        if (provider.isPhantom) {
          try {
            await provider.connect()
            const walletPublicKey = provider.publicKey
            setWallet(walletPublicKey.toString())
            setConnected(true)

            const connection = new Connection(RPC_URL)
            const ata = getAssociatedTokenAddressSync(LIKE_MINT, walletPublicKey)
            const account = await getAccount(connection, ata)
            const amount = Number(account.amount) / 1_000_000_000
            setLikeBalance(amount)
          } catch (err) {
            console.error('Error fetching balance:', err)
            setLikeBalance(0)
          }
        }
      }
    }

    checkWalletAndFetchBalance()
  }, [])

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!wallet) return
      try {
        const connection = new Connection(RPC_URL)
        const walletPublicKey = new PublicKey(wallet)
        const sigs = await connection.getSignaturesForAddress(walletPublicKey, { limit: 5 })
        const txs = await Promise.all(
          sigs.map(async (sig) => {
            const tx = await connection.getTransaction(sig.signature, { commitment: 'confirmed' })
            return {
              signature: sig.signature,
              date: new Date(sig.blockTime * 1000).toLocaleString(),
              amount: tx?.meta?.postTokenBalances?.[0]?.uiTokenAmount?.uiAmount || 'N/A',
            }
          })
        )
        setTransactions(txs)
      } catch (err) {
        console.error('Failed to fetch transactions:', err)
      }
    }

    fetchTransactions()
  }, [wallet])

  const handleFaucet = async () => {
    if (!wallet) return

    const lastClaim = localStorage.getItem(`lastFaucet_${wallet}`)
    const now = Date.now()
    const cooldown = 5 * 60 * 1000

    if (lastClaim && now - parseInt(lastClaim) < cooldown) {
      toast.warn('⏳ Please wait before claiming again!')
      return
    }

    setSending(true)
    try {
      const secret = import.meta.env.VITE_MASTER_SECRET
      if (!secret) throw new Error('⛔ VITE_MASTER_SECRET is undefined.')

      const secretKey = Uint8Array.from(JSON.parse(secret))
      const fromWallet = Keypair.fromSecretKey(secretKey)
      const connection = new Connection(RPC_URL)
      const fromATA = getAssociatedTokenAddressSync(LIKE_MINT, fromWallet.publicKey)
      const toPublicKey = new PublicKey(wallet)
      const toATA = getAssociatedTokenAddressSync(LIKE_MINT, toPublicKey)

      const ix = createTransferInstruction(
        fromATA,
        toATA,
        fromWallet.publicKey,
        100_000_000_000,
        [],
        TOKEN_PROGRAM_ID
      )

      const tx = new Transaction().add(ix)
      tx.feePayer = fromWallet.publicKey
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

      const sig = await connection.sendTransaction(tx, [fromWallet])
      toast.success(`✅ Sent 100 LIKE!`, {
        onClick: () => window.open(`https://explorer.solana.com/tx/${sig}?cluster=devnet`, '_blank'),
      })

      localStorage.setItem(`lastFaucet_${wallet}`, now.toString())
    } catch (err) {
      console.error('❌ Error sending LIKE:', err)
      toast.error('❌ Failed to send LIKE!')
    } finally {
      setSending(false)
    }
  }

  const handleDisconnect = () => {
    if ('solana' in window && window.solana.disconnect) {
      window.solana.disconnect()
      setWallet(null)
      setConnected(false)
      setLikeBalance(null)
      setTransactions([])
    }
  }

  const handleConnectTwitter = () => {
    const mockHandle = prompt('Enter your Twitter handle (e.g. @yourname):')
    if (mockHandle) {
      setTwitterHandle(mockHandle)
      toast.success(`🔗 Connected to ${mockHandle}`)
    }
  }

  const shortenWallet = (addr) => `${addr.slice(0, 4)}...${addr.slice(-4)}`

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      color: theme === 'dark' ? '#fff' : '#000',
      backgroundColor: theme === 'dark' ? '#111' : '#f2f2f2',
      height: '100vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: '80px'
    }}>
      <ToastContainer />

      <div style={{ position: 'absolute', top: 0, width: '100%', backgroundColor: '#222', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', zIndex: 1 }}>
        <div style={{ display: 'inline-block', padding: '10px', animation: 'scroll 20s linear infinite' }}>
          🔥 Trending: $BONK is pumping! | $JUP listing on major DEX | $LIKE airdrop live now! 🚀
        </div>
      </div>

      <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{
        position: 'absolute',
        top: 40,
        right: 10,
        backgroundColor: '#666',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        padding: '5px 10px',
        cursor: 'pointer',
        zIndex: 2
      }}>
        {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
      </button>

      <img src={logo} alt="Like Coin Logo" style={{ width: 100, marginBottom: 20, borderRadius: '12px', zIndex: 2 }} />
      <h1 style={{ zIndex: 2 }}>🚀 Like Coin (Solana)</h1>

      <input
        type="text"
        placeholder="🔎 Search token or address..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          margin: '10px 0',
          padding: '8px 14px',
          fontSize: '16px',
          borderRadius: '8px',
          border: '1px solid #ccc',
          width: '300px',
          zIndex: 2
        }}
      />

      {connected && !twitterHandle && (
        <button
          onClick={handleConnectTwitter}
          style={{
            backgroundColor: '#1DA1F2',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 14px',
            cursor: 'pointer',
            marginBottom: '10px',
            zIndex: 2
          }}
        >
          Connect Twitter 🐦
        </button>
      )}

      {twitterHandle && (
        <p style={{ fontStyle: 'italic', color: theme === 'dark' ? '#ddd' : '#333', zIndex: 2 }}>
          🔗 Linked as <strong>{twitterHandle}</strong>
        </p>
      )}

      {wallet && showWallet && (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', zIndex: 2 }}>
          <Blockies seed={wallet.toLowerCase()} size={10} scale={4} />
          <p style={{ marginLeft: '10px', marginRight: '10px' }}><strong>{shortenWallet(wallet)}</strong></p>
          <button onClick={handleDisconnect} style={{ backgroundColor: '#333', color: '#fff', padding: '6px 10px', borderRadius: '6px', border: 'none' }}>Disconnect</button>
        </div>
      )}

      {wallet && (
        <button
          onClick={() => setShowWallet(!showWallet)}
          style={{
            backgroundColor: '#444',
            color: '#fff',
            padding: '4px 12px',
            fontSize: '13px',
            borderRadius: '6px',
            marginBottom: '10px',
            zIndex: 2,
            border: 'none'
          }}
        >
          {showWallet ? 'Hide Wallet' : 'Show Wallet'}
        </button>
      )}

      <p style={{ zIndex: 2 }}><strong>LIKE Balance:</strong> {likeBalance !== null ? likeBalance : 'Loading...'}</p>

      {wallet && (
        <button
          onClick={handleFaucet}
          disabled={sending}
          style={{
            backgroundColor: '#ffd700',
            color: '#000',
            padding: '10px 20px',
            fontSize: '16px',
            borderRadius: '8px',
            marginTop: '20px',
            cursor: sending ? 'not-allowed' : 'pointer',
            border: 'none',
            zIndex: 2
          }}
        >
          {sending ? 'Sending...' : 'Get 100 LIKE'}
        </button>
      )}

      {transactions.length > 0 && (
        <div style={{ marginTop: '30px', textAlign: 'center', zIndex: 2 }}>
          <h3 style={{ color: '#ffd700' }}>Recent LIKE Transfers</h3>
          {transactions.map((tx, index) => (
            <div key={index} style={{ margin: '10px 0' }}>
              <div><strong>Amount:</strong> {tx.amount} LIKE</div>
              <div><strong>Date:</strong> {tx.date}</div>
              <a
                href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#66f' }}
              >
                View on Explorer ↗
              </a>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  )
}

export default App
