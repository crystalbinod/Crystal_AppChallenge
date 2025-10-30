// screens/ShopScreen.tsx
import * as React from 'react';
import { View, Text, Image, TouchableOpacity,ScrollView, StyleSheet, Modal, Pressable, ActivityIndicator, Alert } from 'react-native';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot, runTransaction } from 'firebase/firestore';
import { useFonts } from 'expo-font';

export default function ShopScreen() {
  const [fontsLoaded] = useFonts({
      'LazyDaze': require('../assets/ATP-Lazy Daze.ttf'),
      'Windows': require('../assets/windows-bold.ttf'),
      'RetroBoulevard': require('../assets/Retro Boulevard.ttf'),
      'Pixel': require('../assets/pixel.ttf'),
    });










    const [loadingUser, setLoadingUser] = React.useState(true);
    const [userData, setUserData] = React.useState<any>({});
    const [checkingAccounts, setCheckingAccounts] = React.useState<Record<string, number>>({});
    const [creditCards, setCreditCards] = React.useState<Record<string, number>>({});
    const [walletVisible, setWalletVisible] = React.useState(false);
    const [walletItem, setWalletItem] = React.useState<{name:string,price:number}|null>(null);
    const [paymentMethod, setPaymentMethod] = React.useState<'debit'|'credit'>('debit');
    const [selectedChecking, setSelectedChecking] = React.useState<string | null>(null);
    const [selectedCard, setSelectedCard] = React.useState<string | null>(null);
    const [processing, setProcessing] = React.useState(false);

    React.useEffect(() => {
      const u = auth.currentUser;
      if (!u) { setLoadingUser(false); return; }
      const ref = doc(db, 'users', u.uid);
      const unsub = onSnapshot(ref, (snap) => {
        if (!snap.exists()) { setUserData({}); setCheckingAccounts({}); setCreditCards({}); setLoadingUser(false); return; }
        const data = snap.data() as any;
        setUserData(data);
        const liquid = data.liquidMoney ?? {};
        const checking = (liquid.checkingAccount && typeof liquid.checkingAccount === 'object') ? liquid.checkingAccount : {};
        const parsedChecking: Record<string, number> = {};
        for (const [k,v] of Object.entries(checking)) parsedChecking[k] = Number(v) || 0;
        setCheckingAccounts(parsedChecking);

        const credit = data.credit ?? {};
        const cards = (credit.creditCards && typeof credit.creditCards === 'object') ? credit.creditCards : {};
        const parsedCards: Record<string, number> = {};
        for (const [k,v] of Object.entries(cards)) parsedCards[k] = Number(v) || 0;
        setCreditCards(parsedCards);

        setLoadingUser(false);
      }, (e) => { console.error('user onSnapshot', e); setLoadingUser(false); });
      return () => unsub();
    }, []);

    const openWallet = (name:string, price:number) => {
      setWalletItem({name, price});
      setPaymentMethod('debit');
      const firstChecking = Object.keys(checkingAccounts)[0] ?? null;
      setSelectedChecking(firstChecking);
      const firstCard = Object.keys(creditCards)[0] ?? null;
      setSelectedCard(firstCard);
      setWalletVisible(true);
    };

    const handlePurchase = async () => {
      if (!walletItem) return;
      const price = Math.floor(walletItem.price || 0);
      const u = auth.currentUser;
      if (!u) return Alert.alert('Not signed in');
      const userRef = doc(db, 'users', u.uid);
      setProcessing(true);
      try {
        if (paymentMethod === 'debit') {
          if (!selectedChecking) { Alert.alert('Choose account', 'Please select a checking account.'); setProcessing(false); return; }
          await runTransaction(db, async (tx) => {
            const snap = await tx.get(userRef);
            if (!snap.exists()) throw new Error('User doc missing');
            const data = snap.data() as any;
            const liquid = data.liquidMoney ?? {};
            const prevTotal = Number(liquid.total) || 0;
            const checkingMap = (liquid.checkingAccount && typeof liquid.checkingAccount === 'object') ? liquid.checkingAccount : {};
            const prevChecking = Number(checkingMap[selectedChecking]) || 0;
            if (prevTotal < price) throw new Error('Insufficient total funds');
            if (prevChecking < price) throw new Error('Insufficient funds in selected checking account');
            const updates: any = {};
            updates['liquidMoney.total'] = prevTotal - price;
            updates['liquidMoney.checkingAccount.' + selectedChecking] = prevChecking - price;
              // increment item counters for Food/Utilities
              if (walletItem?.name === 'Food') {
                const prevFood = Number(data.food) || 0;
                updates['food'] = prevFood + 1;
              } else if (walletItem?.name === 'Utilities') {
                const prevUtilities = Number(data.utilities) || 0;
                updates['utilities'] = prevUtilities + 1;
              }
            tx.update(userRef, updates);
          });
          Alert.alert('Purchased', `${walletItem.name} purchased for $${price} from checking.`);
        } else {
          await runTransaction(db, async (tx) => {
            const snap = await tx.get(userRef);
            if (!snap.exists()) throw new Error('User doc missing');
            const data = snap.data() as any;
            const credit = data.credit ?? {};
            const prevBill = Number(credit.creditCardbill) || 0;
            const newBill = prevBill + price;
            const updates: any = {};
            updates['credit.creditCardbill'] = newBill;
            // increment item counters for Food/Utilities on credit purchases as well
            if (walletItem?.name === 'Food') {
              const prevFood = Number(data.food) || 0;
              updates['food'] = prevFood + 1;
            } else if (walletItem?.name === 'Utilities') {
              const prevUtilities = Number(data.utilities) || 0;
              updates['utilities'] = prevUtilities + 1;
            }
            tx.update(userRef, updates);
          });
          Alert.alert('Purchased', `${walletItem.name} purchased for $${price} on credit.`);
        }
        setWalletVisible(false);
      } catch (e: any) {
        console.error('purchase error', e);
        Alert.alert('Purchase failed', e.message || String(e));
      } finally {
        setProcessing(false);
      }
    };

    
    const styles = StyleSheet.create({
      box:{
        margin: 7,
        flex: 1,
        
        backgroundColor: '#c78e71ff', 
        marginVertical: 7,
        marginTop: 20,
        marginHorizontal: 30,
        borderRadius: 35,
        borderWidth: 5,
        width: 150,
        height:300,
        borderColor: '#63372C'
      },
      textbox:{
        backgroundColor: '#63372C', 
            marginTop:20, 
            paddingHorizontal: 20, 
            paddingVertical:10, 
            borderRadius:15, 
            fontFamily:'Pixel', 
            alignSelf:'center',
            fontSize:20,
            borderWidth:3.5,
            borderColor:'#000000ff'
      },
      button:{
        backgroundColor: '#63372C', 
            marginTop:20, 
            paddingHorizontal: 10, 
            paddingVertical:5, 
            borderRadius:15, 
            fontFamily:'Pixel', 
            alignSelf:'center',
            fontSize:15,
            borderWidth:3.5,
            borderColor:'#000000ff',
            marginHorizontal:15
      }
    })










  return (
  <>
  {/* Center the content in the screen */}
    <ScrollView style={{ flex: 1, backgroundColor: '#F2E5D7' }}>

      {/*row 1*/}
      <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          
          paddingRight: 10
        }}>
        <View style={styles.box}>
          <Text style={styles.textbox}>Food</Text>
           <Image 
                    source={require('../assets/pastry.png')}
                    style={{
                      marginVertical:13 ,
                      
                      width:150,
                      height:100,
                      alignSelf:"center",
                    }}
                  />
            
            <Text style={{
                
                alignSelf:"center", 
                fontFamily:'Pixel',
                fontSize:17,}}>
              $2
        <TouchableOpacity onPress={() => openWallet('Food', 2)}>
          <Text style={styles.button}>Buy</Text>
        </TouchableOpacity>
            </Text>
            
        </View>


        <View style={styles.box}>
          <Text style={styles.textbox}>House</Text>

           <Image 
                    source={require('../assets/house2.png')}
                    style={{
                      marginTop:5,
                      width:120,
                      height:120,
                      alignSelf:"center",
                    }}
                  />
           <Text style={{
                alignSelf:"center", 
                fontFamily:'Pixel',
                fontSize:17}}>
              $50,000
        <TouchableOpacity onPress={() => openWallet('House', 50000)}>
          <Text style={styles.button}>Buy</Text>
        </TouchableOpacity>
            </Text>
        </View>
      </View>


      {/*Row 2*/}
      <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          
          paddingRight: 10
        }}>
         <View style={styles.box}>
          <Text style={styles.textbox}>Utilities</Text>
           <Image 
                    source={require('../assets/utilities.png')}
                    style={{
                      marginVertical:13 ,
                      
                      width:150,
                      height:100,
                      alignSelf:"center",
                    }}
                  />
            
            <Text style={{
                
                alignSelf:"center", 
                fontFamily:'Pixel',
                fontSize:17,}}>
              $2
        <TouchableOpacity onPress={() => openWallet('Utilities', 2)}>
          <Text style={styles.button}>Buy</Text>
        </TouchableOpacity>
            </Text>
            
        </View>


        <View style={styles.box}>
          <Text style={styles.textbox}>car</Text>

           <Image 
                    source={require('../assets/car.png')}
                    style={{
                      marginTop:30,
                      marginBottom:10,
                      width:200,
                      height:80,
                      alignSelf:"center",
                    }}
                  />
           <Text style={{
                alignSelf:"center", 
                fontFamily:'Pixel',
                fontSize:17}}>
              $50,000
        <TouchableOpacity onPress={() => openWallet('Car', 50000)}>
          <Text style={styles.button}>Buy</Text>
        </TouchableOpacity>
            </Text>
        </View>
      </View>
        
          
        
      
    </ScrollView>

    {/* Wallet Modal */}
    <Modal
      visible={walletVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => { if (!processing) setWalletVisible(false); }}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View style={{ backgroundColor: '#fff8f3', padding: 16, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
          {walletItem ? (
            <>
              <Text style={{ fontFamily: 'Windows', fontSize: 20, color: '#63372C' }}>{walletItem.name}</Text>
              <Text style={{ fontFamily: 'Pixel', marginTop: 6 }}>Price: ${walletItem.price}</Text>

              <View style={{ height: 12 }} />
              <Text style={{ fontFamily: 'Pixel', fontWeight: '700' }}>Payment method</Text>
              <View style={{ flexDirection: 'row', marginTop: 8 }}>
                <TouchableOpacity onPress={() => setPaymentMethod('debit')} style={{ marginRight: 12 }}>
                  <Text style={{ color: paymentMethod === 'debit' ? '#63372C' : '#999', fontFamily: 'Pixel' }}>Debit (Checking)</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPaymentMethod('credit')}>
                  <Text style={{ color: paymentMethod === 'credit' ? '#63372C' : '#999', fontFamily: 'Pixel' }}>Credit</Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 12 }} />
              {paymentMethod === 'debit' ? (
                <>
                  <Text style={{ fontFamily: 'Pixel', fontWeight: '700' }}>Choose checking account</Text>
                  {Object.entries(checkingAccounts).length === 0 && <Text style={{ fontFamily: 'Pixel' }}>No checking accounts</Text>}
                  {Object.entries(checkingAccounts).map(([k,v]) => (
                    <TouchableOpacity key={k} onPress={() => setSelectedChecking(k)} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
                      <Text style={{ fontFamily: 'Pixel', color: selectedChecking === k ? '#63372C' : '#000' }}>{k}</Text>
                      <Text style={{ fontFamily: 'Pixel' }}>${v}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              ) : (
                <>
                  <Text style={{ fontFamily: 'Pixel', fontWeight: '700' }}>Choose credit card</Text>
                  {Object.entries(creditCards).length === 0 && <Text style={{ fontFamily: 'Pixel' }}>No credit cards</Text>}
                  {Object.entries(creditCards).map(([k,v]) => (
                    <TouchableOpacity key={k} onPress={() => setSelectedCard(k)} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
                      <Text style={{ fontFamily: 'Pixel', color: selectedCard === k ? '#63372C' : '#000' }}>{k}</Text>
                      <Text style={{ fontFamily: 'Pixel' }}>Limit: ${v}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              <View style={{ height: 12 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Pressable onPress={() => { if (!processing) setWalletVisible(false); }} style={{ padding: 12, backgroundColor: '#777', borderRadius: 8 }}>
                  <Text style={{ color: '#fff', fontFamily: 'Pixel' }}>Cancel</Text>
                </Pressable>
                <Pressable onPress={handlePurchase} style={{ padding: 12, backgroundColor: '#C97D60', borderRadius: 8 }}>
                  {processing ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontFamily: 'Pixel' }}>Confirm purchase</Text>}
                </Pressable>
              </View>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  </>
  );
}
