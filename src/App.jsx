import { useEffect, useState } from 'react'
import { Connection, PublicKey } from '@solana/web3.js'
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token'

const LIKE_MINT = new PublicKey('3Nx5eK8sZd8Sqa6fVqkwEP3j9Dt2PwkqctGBYHTaeyQT')
const RPC_URL = 'https://api.devnet.solana.com'

function App() {
  const [wallet, setWallet] = useState(null)
  const [likeBalance, setLikeBalance] = useState(null)

  useEffect(() => {
    const checkWallet = async () => {
      if ('solana' in window) {
        const provider = window.solana
        if (provider.isPhantom) {
          await provider.connect()
          setWallet(provider.publicKey.toString())

          const conn = new Connection(RPC_URL)
          const ata = await getAssociatedTokenAddress(LIKE_MINT, provider.publicKey)
          try {
            const tokenAccount = await getAccount(conn, ata)
            setLikeBalance(Number(tokenAccount.amount) / 1_000_000_000)
          } catch (e) {
            setLikeBalance(0)
          }
        }
      }
    }

    checkWallet()
  }, [])

  const copyToClipboard = () => {
    if (wallet) {
      navigator.clipboard.writeText(wallet)
      alert('Wallet address copied!')
    }
  }

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      color: '#fff',
      backgroundColor: '#141414',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🚀 Like Coin Dashboard</h1>
      <p><strong>Wallet:</strong> {wallet || 'Not connected'}</p>
      {wallet && (
        <button 
          onClick={copyToClipboard} 
          style={{
            marginTop: '5px',
            padding: '5px 15px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            background: '#FFD700',
            border: 'none',
            borderRadius: '5px'
          }}
        >
          Copy Wallet
        </button>
      )}
      <p style={{ marginTop: '20px', fontSize: '1.2rem' }}>
        <strong>LIKE Balance:</strong> {likeBalance !== null ? likeBalance : 'Loading...'}
      </p>
    </div>
  )
}

export default App
