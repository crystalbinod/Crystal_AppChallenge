// screens/ProfileScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Button, Image, ImageBackground,TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {


  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const screenWidth= useWindowDimensions().width
   // Keep all user fields in a single object so UI + Firestore stay in sync.
  const [userData, setUserData] = useState<{ [k: string]: any }>({
    displayName: '',
    username: '',
    password: '',
    job: '',
    housing:'',
    lifeStatus:'',
    utilities:'',
    food:'',
    credit:'',
    creditCardBill:'',
    creditCardLimit:'',
  });
  const [loading, setLoading] = useState(true);

  // Generic getter for a field (keeps backwards compatibility)
  const getUserFieldValue = async (fieldKey: string): Promise<any | null> => {
    const u = auth.currentUser;
    if (!u) return null;
    const docRef = doc(db, 'users', u.uid);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    return data[fieldKey] ?? null;
  };

  // Fetch the user's document once when the component mounts.
  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const u = auth.currentUser;
        if (!u) {
          console.warn('No auth.user available yet');
          setLoading(false);
          return;
        }
        const docRef = doc(db, 'users', u.uid);
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
          console.log('User doc not found; leaving defaults.');
          setLoading(false);
          return;
        }
        if (!mounted) return;
        const data = snap.data() || {};
        // Pick fields you want; this just spreads everything
        setUserData(prev => ({ ...prev, 
          ...data,
          username: data.email ?? '', 
          job: data.job ?? '',
          housing: data.housing ?? '',
          lifeStatus: data.lifeStatus ?? '',
          utilities: data.utilities ?? '',
          food: data.food ?? '',
          credit: data.credit ?? '',
          creditCardBill: data.creditCardBill ?? '',

          creditCardLimit: data.creditCardLimit ?? '',
         
         }));
      } catch (err) {
        console.error('fetchAll error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAll();
    return () => { mounted = false; };
  }, []);

  // Generic setter: updates local state immediately, writes to Firestore (merge).
  const handleChange = async (fieldKey: string, value: string) => {
    // Update UI immediately
    setUserData(prev => ({ ...prev, [fieldKey]: value }));

    // Write to Firestore
    try {
      const u = auth.currentUser;
      if (!u) {
        console.warn('No user signed-in; cannot write to Firestore');
        return;
      }
      await setDoc(doc(db, 'users', u.uid), { [fieldKey]: value }, { merge: true });
      console.log(`Updated ${fieldKey} in Firestore:`, value);
    } catch (e) {
      console.error(`Failed to update ${fieldKey} in Firestore:`, e);
    }
  };












const styles = StyleSheet.create({
    input: {
      height: 23,
      minWidth:230,
      paddingHorizontal: 5,
      marginHorizontal: 8,
      borderWidth: 2,
      fontSize:12,
      fontFamily:'Pixel',
      backgroundColor:'#C97D60',
      color:'#080808ff',
      borderRadius:10,
      borderColor:"#080808ff"},
    scroll:{
      flex: 1, 
      backgroundColor: '#F2E5D7',
      flexDirection: 'space-evenly'
    },
    text:{
      marginLeft:17,
      fontSize:12,
      fontFamily:'Pixel',
      color:'#C97D60',
      marginBottom:7,
    }
    
    });












  return (
    // Center the content in the screen
    <ScrollView style={styles.scroll}>
                
                
                <View style={{ 
            flex: 1, 
            backgroundColor: '#F2E5D7',
            flexDirection:"row"
          }}>
               {/* column 1 */}
                  <View style={{ 
                          flex: 1.8, 
                          backgroundColor: '#F2E5D7',
                          marginVertical:20,
                          marginLeft:10,
                          marginRight:15,
                          
                          
                        }}>
                          {/* row 1 */}
                          {/* Login Title */}
                          <View style={{
                            backgroundColor:'#63372C',
                            borderRadius:25,
                            
                            height: 150,
                            
                            
                            
                            }}>
                            <Text style={{
                            fontSize: 15,
                            color: '#C97D60',
                            fontFamily: 'Pixel',
                            fontWeight:"bold" ,
                            margin:5,
                            marginLeft:17,

                            }}>
                              login info:
                              </Text>
                              <Text style={styles.text}>Name:  
                                  <TextInput
                                      placeholder="name?"
                                      onChangeText={(t) => handleChange('displayName', t)}
                                      value={userData.displayName}
                                      style={styles.input}
                              /></Text>

                               <Text style={styles.text}>username: 
                                
                                <Text style={styles.input}>
                                {userData.username}</Text>
                                  
                              </Text>

                               <Text style={styles.text}>password: 
                                <TextInput
                                      placeholder="password?"
                                      onChangeText={(t) => handleChange('password', t)}
                                      value={userData.password}
                                      style={styles.input}
                              />
                                

                                  </Text>
                             
                          </View>

                          {/* row 2 */}
                          <View style={{
                            backgroundColor:'#63372C',
                            borderRadius:25,
                            
                            height: 300,
                            marginTop:10,
                            
                            
                            }}>
                            <Text style={{
                            fontSize: 15,
                            color: '#C97D60',
                            fontFamily: 'Pixel',
                            fontWeight:"bold" ,
                            margin:5,
                            marginLeft:17,
                            

                            }}>
                              status:
                              </Text>

                              <Text style={styles.text}>job: 
                                
                                <Text style={styles.input}>
                                {userData.job}</Text>
                                  
                              </Text>
                              <Text style={styles.text}>housing: 
                                
                                <Text style={styles.input}>
                                {userData.housing}</Text>
                                  
                              </Text>
                              

                          </View>
                          
                          
                
                </View>
                
                {/* column 2 */}
                <View style={{ 
                      flex: 0.9, 
                      backgroundColor: '#F2E5D7',
                      marginVertical:20, 
                      marginRight:10, 
                         
                      }}>

                      {/* row 1 */}
                      {/* Home Screen Title */}
                      <View style={{
                            backgroundColor:'#63372C',
                            borderRadius:15,
                            
                            height: 200,
                            
                            
                            
                            }}>
                            <Text style={{
                            fontSize: 15,
                            color: '#C97D60',
                            fontFamily: 'Pixel',
                            fontWeight:"bold" ,
                            margin:5,
                            marginLeft:17,
                            

                            }}>
                              Financial Info:
                              </Text>
                              <Text style={styles.text}>food: 
                                
                                <Text style={styles.input}>
                                {userData.food}</Text>
                                  
                              </Text>
                              <Text style={styles.text}>utilities: 
                                
                                <Text style={styles.input}>
                                {userData.utilities}</Text>
                                  
                              </Text>
                              <Text style={styles.text}>credit score: 
                                
                                <Text style={styles.input}>
                                {userData.credit}</Text>
                                  
                              </Text>
                              <Text style={styles.text}>credit bill: 
                                
                                <Text style={styles.input}>
                                {userData.creditCardBill}</Text>
                                  
                              </Text>

                              <Text style={styles.text}>credit limit: 
                                
                                <Text style={styles.input}>
                                {userData.creditCardLimit}</Text>
                                  
                              </Text>
                          </View>
                          
                
                </View>
            
                </View>

                {/* row 2 */}
    
                {/* column 2 */}
                {/* Logout Button */}
                        <TouchableOpacity
                          onPress={async () => {
                            try {
                              await signOut(auth);
                              // Reset stack to Login
                              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                            } catch (err) {
                              console.error('Sign-out error', err);
                            }
                          }}
                          activeOpacity={0.7}  
                        >
                         <ImageBackground
                            source={require('../assets/button.png')}
                            style={{ width: 200, height: 100, justifyContent: 'center', alignItems: 'center' }}
                          >
                            <Text style={{
                              color: '#63372C',
                              fontSize: 20,
                              fontWeight: "bold",
                              fontFamily: "Pixel",
                            }}>
                              Logout
                            </Text>
                          </ImageBackground>
                        </TouchableOpacity>
                
        </ScrollView>
  );
}