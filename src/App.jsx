import { Buffer } from 'buffer'
window.Buffer = Buffer

import { useEffect, useState } from 'react'
import { Connection, PublicKey, sendAndConfirmTransaction, Transaction } from '@solana/web3.js'
import {
  getAssociatedTokenAddressSync,
  getAccount,
  createTransferInstruction
} from '@solana/spl-token'

// 🔑 Master wallet secret key from .env file
const secret = import.meta.env.VITE_MASTER_SECRET
const secretKey = Uint8Array.from(JSON.parse(secret))
const masterKeypair = window.solanaWeb3.Keypair.fromSecretKey(secretKey)

const RPC_URL = 'https://api.devnet.solana.com'
const LIKE_MINT = new PublicKey('3Nx5eK8sZd8Sqa6fVqkwEP3j9Dt2PwkqctGBYHTaeyQT')

function App() {
  const [wallet, setWallet] = useState(null)
  const [likeBalance, setLikeBalance] = useState(null)

  // 🧠 Get LIKE balance of connected wallet
  const fetchBalance = async (publicKey) => {
    const connection = new Connection(RPC_URL)
    const ata = getAssociatedTokenAddressSync(LIKE_MINT, publicKey)
    try {
      const account = await getAccount(connection, ata)
      const amount = Number(account.amount) / 1_000_000_000 // Adjust decimals
      setLikeBalance(amount)
    } catch (err) {
      console.error('Error fetching balance:', err)
      setLikeBalance(0)
    }
  }

  // 🚀 Transfer 100 LIKE from master to connected wallet
  const transferTokens = async () => {
    if (!wallet) return
    try {
      const connection = new Connection(RPC_URL)
      const fromTokenAccount = getAssociatedTokenAddressSync(LIKE_MINT, masterKeypair.publicKey)
      const toTokenAccount = getAssociatedTokenAddressSync(LIKE_MINT, new PublicKey(wallet))

      const transaction = new Transaction().add(
        createTransferInstruction(
          fromTokenAccount,
          toTokenAccount,
          masterKeypair.publicKey,
          100_000_000 // 100 LIKE
        )
      )

      const signature = await sendAndConfirmTransaction(connection, transaction, [masterKeypair])
      console.log('✅ Transfer signature:', signature)
      alert('100 LIKE sent!')

      // Update balance
      fetchBalance(new PublicKey(wallet))
    } catch (err) {
      console.error('❌ Transfer error:', err)
      alert('Transfer failed. See console for details.')
    }
  }

  useEffect(() => {
    const checkWallet = async () => {
      if ('solana' in window) {
        const provider = window.solana
        if (provider.isPhantom) {
          await provider.connect()
          setWallet(provider.publicKey.toString())
          fetchBalance(provider.publicKey)
        }
      }
    }
    checkWallet()
  }, [])

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
        <button onClick={transferTokens} style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#00c896',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}>
          Get 100 LIKE
        </button>
      )}
    </div>
  )
}

export default App
