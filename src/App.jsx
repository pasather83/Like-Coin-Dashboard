import { Buffer } from 'buffer'
window.Buffer = Buffer
import { useEffect, useState } from 'react'
import { Connection, PublicKey } from '@solana/web3.js'
import {
  getAssociatedTokenAddressSync,
  getAccount
} from '@solana/spl-token'

const RPC_URL = 'https://api.devnet.solana.com'
const LIKE_MINT = new PublicKey('3Nx5eK8sZd8Sqa6fVqkwEP3j9Dt2PwkqctGBYHTaeyQT')

function App() {
  const [wallet, setWallet] = useState(null)
  const [likeBalance, setLikeBalance] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const checkWalletAndFetchBalance = async () => {
      if ('solana' in window) {
        const provider = window.solana
        if (provider.isPhantom) {
          try {
            await provider.connect()
            const walletPublicKey = provider.publicKey
            setWallet(walletPublicKey.toString())

            const connection = new Connection(RPC_URL)
            const ata = getAssociatedTokenAddressSync(
              LIKE_MINT,
              walletPublicKey
            )

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

  // Faucet Simulation
  const simulateFaucet = () => {
    setMessage('💧 Simulated 1000 LIKE Coin airdrop to your wallet!')
    setLikeBalance((prev) => prev + 1000)
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

      <button
        onClick={simulateFaucet}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer'
        }}
      >
        💧 Get Free LIKE
      </button>

      {message && <p style={{ marginTop: '10px' }}>{message}</p>}
    </div>
  )
}

export default App
