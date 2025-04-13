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
const USDC_PRICE = 0.005 // Simulated: 1 LIKE = 0.005 USDC

function App() {
  const [wallet, setWallet] = useState(null)
  const [likeBalance, setLikeBalance] = useState(null)
  const [sending, setSending] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [connected, setConnected] = useState(false)
  const [swapAmount, setSwapAmount] = useState('')
  const [usdcOutput, setUsdcOutput] = useState('')

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

  const handleSwapChange = (e) => {
    const input = e.target.value
    setSwapAmount(input)
    const simUSDC = parseFloat(input) * USDC_PRICE
    setUsdcOutput(simUSDC.toFixed(4))
  }

  const shortenWallet = (addr) => `${addr.slice(0, 4)}...${addr.slice(-4)}`

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      color: '#fff',
      backgroundColor: '#111',
      height: '100%',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <ToastContainer />
      <img src={logo} alt="Like Coin Logo" style={{ width: 100, marginBottom: 20, borderRadius: '12px' }} />
      <h1>🚀 Like Coin (Solana)</h1>

      {wallet && (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
          <Blockies seed={wallet.toLowerCase()} size={10} scale={4} />
          <p style={{ marginLeft: '10px', marginRight: '10px' }}><strong>{shortenWallet(wallet)}</strong></p>
          <button onClick={handleDisconnect} style={{ backgroundColor: '#333', color: '#fff', padding: '6px 10px', borderRadius: '6px', border: 'none' }}>Disconnect</button>
        </div>
      )}

      <p><strong>LIKE Balance:</strong> {likeBalance !== null ? likeBalance : 'Loading...'}</p>

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
            border: 'none'
          }}
        >
          {sending ? 'Sending...' : 'Get 100 LIKE'}
        </button>
      )}

      <div style={{ marginTop: '40px' }}>
        <h3 style={{ color: '#ffd700' }}>💱 Swap Simulator (LIKE → USDC)</h3>
        <input
          type="number"
          value={swapAmount}
          onChange={handleSwapChange}
          placeholder="Enter LIKE amount"
          style={{ padding: '10px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '10px' }}
        />
        <p><strong>Estimated USDC:</strong> {usdcOutput}</p>
      </div>

      {transactions.length > 0 && (
        <div style={{ marginTop: '30px', textAlign: 'center' }}>
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
    </div>
  )
}

export default App
