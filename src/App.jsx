import { useEffect, useState } from 'react'
import { Connection, PublicKey, Keypair, Transaction } from '@solana/web3.js'
import {
  getAssociatedTokenAddressSync,
  createTransferInstruction,
  getAccount,
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

  const handleFaucet = async () => {
    if (!wallet) return
    setSending(true)

    try {
      const secret = import.meta.env.VITE_MASTER_SECRET
      if (!secret) throw new Error('⛔ VITE_MASTER_SECRET is undefined. Check your .env and Vite config.')

      const secretKey = Uint8Array.from(JSON.parse(secret))
      const fromWallet = Keypair.fromSecretKey(secretKey)
      const connection = new Connection(RPC_URL)

      const fromATA = getAssociatedTokenAddressSync(LIKE_MINT, fromWallet.publicKey)
      const toATA = getAssociatedTokenAddressSync(LIKE_MINT, new PublicKey(wallet))

	const ix = createTransferInstruction(fromATA,toATA,fromWallet.publicKey,100_000_000_000, // ✅ 100 LIKE
  [],
  TOKEN_PROGRAM_ID
)
   


   const ix = createTransferInstruction(
        fromATA,
        toATA,
        fromWallet.publicKey,
	100_000_000_000, // 100 LIKE in lamports
        [],
        TOKEN_PROGRAM_ID
      )

      const transaction = new Transaction().add(ix)
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
      transaction.feePayer = fromWallet.publicKey

      const tx = await connection.sendTransaction(transaction, [fromWallet])
      console.log(`✅ Sent 100 LIKE to ${wallet}: ${tx}`)

      // Update UI balance
      const ata = getAssociatedTokenAddressSync(LIKE_MINT, new PublicKey(wallet))
      const updatedAccount = await getAccount(connection, ata)
      const updatedAmount = Number(updatedAccount.amount) / 1_000_000_000
      setLikeBalance(updatedAmount)
    } catch (err) {
      console.error('❌ Error sending LIKE:', err)
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
    </div>
  )
}

export default App
