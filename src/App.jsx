import { Buffer } from 'buffer'
window.Buffer = Buffer

import { useEffect, useState } from 'react'
import { Connection, PublicKey, Keypair, sendAndConfirmTransaction } from '@solana/web3.js'
import {
  getAssociatedTokenAddressSync,
  createTransferInstruction
} from '@solana/spl-token'

const RPC_URL = 'https://api.devnet.solana.com'
const LIKE_MINT = new PublicKey('3Nx5eK8sZd8Sqa6fVqkwEP3j9Dt2PwkqctGBYHTaeyQT')

// Replace this with your actual id.json contents
const masterKeypair = Keypair.fromSecretKey(Uint8Array.from([
  // paste your secret key array from id.json here
]))

function App() {
  const [wallet, setWallet] = useState(null)
  const [likeBalance, setLikeBalance] = useState(null)
  const connection = new Connection(RPC_URL)

  useEffect(() => {
    const checkWalletAndFetchBalance = async () => {
      if ('solana' in window) {
        const provider = window.solana
        if (provider.isPhantom) {
          await provider.connect()
          const walletPublicKey = provider.publicKey
          setWallet(walletPublicKey.toString())

          const ata = getAssociatedTokenAddressSync(
            LIKE_MINT,
            walletPublicKey
          )

          try {
            const accountInfo = await connection.getTokenAccountBalance(ata)
            const amount = Number(accountInfo.value.amount) / 1_000_000_000
            setLikeBalance(amount)
          } catch (e) {
            console.error('Token account not found or empty:', e)
            setLikeBalance(0)
          }
        }
      }
    }

    checkWalletAndFetchBalance()
  }, [])

  const handleFaucetDrop = async () => {
    try {
      const userPublicKey = new PublicKey(wallet)
      const userATA = getAssociatedTokenAddressSync(LIKE_MINT, userPublicKey)
      const masterATA = getAssociatedTokenAddressSync(LIKE_MINT, masterKeypair.publicKey)

      const tx = new Transaction().add(
        createTransferInstruction(
          masterATA,
          userATA,
          masterKeypair.publicKey,
          100_000_000 // 100 LIKE (with 9 decimals)
        )
      )

      const signature = await sendAndConfirmTransaction(connection, tx, [masterKeypair])
      alert('Sent 100 LIKE! Tx: ' + signature)
    } catch (err) {
      console.error('Faucet error:', err)
      alert('Faucet failed: ' + err.message)
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
        <button onClick={handleFaucetDrop} style={{
          marginTop: '20px',
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          Get 100 LIKE 💰
        </button>
      )}
    </div>
  )
}

export default App
