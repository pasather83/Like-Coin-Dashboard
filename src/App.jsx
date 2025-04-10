import { Buffer } from 'buffer'
window.Buffer = Buffer
import { useEffect, useState } from 'react'
import { Connection, PublicKey, Keypair, sendAndConfirmTransaction } from '@solana/web3.js'
import {
  getAssociatedTokenAddressSync,
  createTransferInstruction,
  getAccount
} from '@solana/spl-token'

const RPC_URL = 'https://api.devnet.solana.com'
const connection = new Connection(RPC_URL)
const LIKE_MINT = new PublicKey('3Nx5eK8sZd8Sqa6fVqkwEP3j9Dt2PwkqctGBYHTaeyQT')

// Your secret key array (DO NOT commit this to GitHub in production!)
const secretKey = Uint8Array.from([243,172,153,145,97,255,18,165,27,116,177,88,144,130,13,58,149,205,251,248,196,50,96,145,181,214,53,108,126,72,237,237,71,68,26,11,64,195,30,17,166,12,207,187,119,161,56,124,127,69,1,177,122,221,211,31,55,49,43,188,148,4,43,54])
const fromWallet = Keypair.fromSecretKey(secretKey)

function App() {
  const [wallet, setWallet] = useState(null)
  const [likeBalance, setLikeBalance] = useState(null)
  const [txStatus, setTxStatus] = useState(null)

  useEffect(() => {
    const checkWalletAndFetchBalance = async () => {
      if ('solana' in window) {
        const provider = window.solana
        if (provider.isPhantom) {
          try {
            await provider.connect()
            const pubKey = provider.publicKey
            setWallet(pubKey.toString())

            const ata = getAssociatedTokenAddressSync(LIKE_MINT, pubKey)
            const account = await getAccount(connection, ata)
            setLikeBalance(Number(account.amount) / 1_000_000_000)
          } catch (err) {
            setLikeBalance(0)
          }
        }
      }
    }

    checkWalletAndFetchBalance()
  }, [])

  const handleGetTokens = async () => {
    if (!wallet) return
    setTxStatus('Sending...')

    try {
      const toPubkey = new PublicKey(wallet)
      const fromATA = getAssociatedTokenAddressSync(LIKE_MINT, fromWallet.publicKey)
      const toATA = getAssociatedTokenAddressSync(LIKE_MINT, toPubkey)

      const ix = createTransferInstruction(fromATA, toATA, fromWallet.publicKey, 100_000_000) // 100 LIKE

      const tx = await sendAndConfirmTransaction(connection, {
        feePayer: fromWallet.publicKey,
        instructions: [ix],
        signers: [fromWallet],
      })

      setTxStatus('✅ Success: ' + tx)
    } catch (e) {
      console.error(e)
      setTxStatus('❌ Error sending tokens')
    }
  }

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      color: '#fff',
      backgroundColor: '#111',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1>🚀 Like Coin Dashboard</h1>
      <p>Wallet: {wallet || 'Not connected'}</p>
      <p>LIKE Balance: {likeBalance !== null ? likeBalance : 'Loading...'}</p>

      {wallet && (
        <button onClick={handleGetTokens} style={{
          padding: '10px 20px',
          fontSize: '16px',
          marginTop: '20px',
          cursor: 'pointer',
          background: '#00ff9d',
          border: 'none',
          borderRadius: '10px'
        }}>
          Get 100 LIKE 💸
        </button>
      )}

      {txStatus && <p style={{ marginTop: '20px' }}>{txStatus}</p>}
    </div>
  )
}

export default App
