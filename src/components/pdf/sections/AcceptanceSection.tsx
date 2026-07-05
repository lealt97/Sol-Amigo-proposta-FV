import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { Proposal } from '../../../types/proposal';

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 30,
    backgroundColor: '#fafafa', // zinc-50
    border: '1px solid #e4e4e7',
    borderRadius: 8,
    alignItems: 'center',
    textAlign: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#18181b',
    marginBottom: 10,
  },
  text: {
    fontSize: 12,
    color: '#52525b',
    marginBottom: 20,
    lineHeight: 1.5,
  },
  linkBox: {
    backgroundColor: '#eff6ff', // blue-50
    border: '1px solid #bfdbfe', // blue-200
    padding: 15,
    borderRadius: 6,
    width: '100%',
  },
  linkTitle: {
    fontSize: 10,
    color: '#3b82f6', // blue-500
    textTransform: 'uppercase',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  link: {
    fontSize: 12,
    color: '#1d4ed8', // blue-700
  },
  signatureBox: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 60,
  },
  signatureLineContainer: {
    width: '45%',
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#18181b',
    marginBottom: 10,
  },
  signatureName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#18181b',
  },
  signatureRole: {
    fontSize: 10,
    color: '#71717a',
  }
});

export const AcceptanceSection = ({ proposal }: { proposal: Proposal }) => {
  const publicUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/proposta/${proposal.public_token}` 
    : `https://[SISTEMA]/proposta/${proposal.public_token}`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Próximos Passos</Text>
      <Text style={styles.text}>
        Agradecemos a oportunidade de apresentar esta proposta comercial. 
        Para aprovar e dar início ao projeto do seu sistema de energia solar, 
        acesse o link abaixo ou assine este documento.
      </Text>
      
      {proposal.public_token && (
        <View style={styles.linkBox}>
          <Text style={styles.linkTitle}>Link para Aprovação Digital:</Text>
          <Text style={styles.link}>{publicUrl}</Text>
        </View>
      )}

      <View style={styles.signatureBox}>
        <View style={styles.signatureLineContainer}>
          <View style={styles.signatureLine}></View>
          <Text style={styles.signatureName}>{proposal.profile?.seller_name || proposal.profile?.company_name || 'Empresa de Energia Solar'}</Text>
          <Text style={styles.signatureRole}>Representante Comercial</Text>
        </View>
        <View style={styles.signatureLineContainer}>
          <View style={styles.signatureLine}></View>
          <Text style={styles.signatureName}>{proposal.client?.name || 'Cliente'}</Text>
          <Text style={styles.signatureRole}>De acordo</Text>
        </View>
      </View>
    </View>
  );
};
