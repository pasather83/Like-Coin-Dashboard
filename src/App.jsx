import { useEffect, useState } from 'react'
import { Connection, PublicKey, Keypair } from '@solana/web3.js'
import {
  getAssociatedTokenAddress,
  getAccount,
  createTransferInstruction,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token'

import { Buffer } from 'buffer'
window.Buffer = Buffer

const RPC_URL = 'https://api.devnet.solana.com'
const LIKE_MINT = new PublicKey('3Nx5eK8sZd8Sqa6fVqkwEP3j9Dt2PwkqctGBYHTaeyQT')

function App() {
  const [wallet, setWallet] = useState(null)
  const [likeBalance, setLikeBalance] = useState(null)
  const [sending, setSending] = useState(false)

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
            const ata = await getAssociatedTokenAddress(
              LIKE_MINT,
              walletPublicKey
            )

            console.log('Wallet:', walletPublicKey.toBase58())
            console.log('ATA:', ata.toBase58())

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

  const handleGet100LIKE = async () => {
    if (!wallet) return
    setSending(true)

    try {
      const connection = new Connection(RPC_URL)
      const recipient = new PublicKey(wallet)

      const secretKey = JSON.parse(import.meta.env.VITE_MASTER_SECRET)
      const fromWallet = Keypair.fromSecretKey(Uint8Array.from(secretKey))

      const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        fromWallet,
        LIKE_MINT,
        fromWallet.publicKey
      )

      const toTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        fromWallet,
        LIKE_MINT,
        recipient
      )

      const tx = await connection.sendTransaction(
        await (async () => {
          const { Transaction } = await import('@solana/web3.js')
          const transaction = new Transaction().add(
            createTransferInstruction(
              fromTokenAccount.address,
              toTokenAccount.address,
              fromWallet.publicKey,
              100_000_000, // 100 LIKE
              [],
              TOKEN_PROGRAM_ID
            )
          )
          transaction.feePayer = fromWallet.publicKey
          transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash
          transaction.sign(fromWallet)
          return transaction
        })()
      )

      console.log('✅ Transaction sent:', tx)
      alert('100 LIKE sent successfully!')
    } catch (err) {
      console.error('❌ Error sending LIKE:', err)
      alert('Failed to send LIKE.')
    } finally {
      setSending(false)
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
      <p><strong>Wallet:</strong> {wallet || 'Not connected'}</p>
      <p><strong>LIKE Balance:</strong> {likeBalance !== null ? likeBalance : 'Loading...'}</p>

      {wallet && (
        <button
          onClick={handleGet100LIKE}
          disabled={sending}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#ffcc00',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          {sending ? 'Sending...' : '🎁 Get 100 LIKE'}
        </button>
      )}
    </div>
  )
}

export default App
