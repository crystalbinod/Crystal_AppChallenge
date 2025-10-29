// screens/ShopScreen.tsx
import * as React from 'react';
import { View, Text, Image, TouchableOpacity,ScrollView, StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';

export default function ShopScreen() {
  const [fontsLoaded] = useFonts({
      'LazyDaze': require('../assets/ATP-Lazy Daze.ttf'),
      'Windows': require('../assets/windows-bold.ttf'),
      'RetroBoulevard': require('../assets/Retro Boulevard.ttf'),
      'Pixel': require('../assets/pixel.ttf'),
    });










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
    // Center the content in the screen
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
              <TouchableOpacity>
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
              <TouchableOpacity>
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
              <TouchableOpacity>
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
              <TouchableOpacity>
                  <Text style={styles.button}>Buy</Text>
              </TouchableOpacity>
            </Text>
        </View>
      </View>
        
          
        
      
    </ScrollView>
  );
}
