import { getAssociatedTokenAddress } from '@solana/spl-token';
import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection("https://api.devnet.solana.com");

const LIKE_MINT = new PublicKey("3Nx5eK8sZd8Sqa6fVqkwEP3j9Dt2PwkqctGBYHTaeyQT");
useEffect(() => {
  const fetchBalance = async () => {
    try {
      if (!publicKey) return;

      const tokenAccount = await getAssociatedTokenAddress(
        LIKE_MINT,
        publicKey
      );

      const accountInfo = await connection.getTokenAccountBalance(tokenAccount);
      setLikeBalance(accountInfo.value.uiAmount);
    } catch (err) {
      console.error('Error fetching LIKE balance:', err);
      setLikeBalance(0); // fallback to 0 if not found
    }
  };

  fetchBalance();
}, [publicKey]);
