import React from 'react';
import { View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { Proposal } from '../../../types/proposal';

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#18181b',
    borderBottom: '2px solid #3b82f6',
    paddingBottom: 5,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3f3f46',
    marginBottom: 10,
    marginTop: 20,
  },
  listItem: {
    fontSize: 11,
    color: '#52525b',
    marginBottom: 6,
    paddingLeft: 10,
    lineHeight: 1.4,
  },
  bullet: {
    width: 4,
    height: 4,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    top: 6,
  },
  itemContainer: {
    position: 'relative',
  },
  signatureBox: {
    marginTop: 30,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: '#e4e4e7',
  },
  signatureHeader: {
    fontSize: 9,
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  signatureImage: {
    width: 175,
    height: 62,
    objectFit: 'contain',
    marginBottom: 2,
  },
  signatureLine: {
    width: 220,
    height: 1,
    backgroundColor: '#a1a1aa',
    marginTop: 44,
    marginBottom: 8,
  },
  sellerName: {
    fontSize: 12,
    color: '#18181b',
    fontWeight: 'bold',
  },
  sellerRole: {
    fontSize: 9,
    color: '#3b82f6',
    marginTop: 2,
    fontWeight: 'bold',
  },
  sellerMeta: {
    fontSize: 9,
    color: '#52525b',
    marginTop: 2,
  },
});

const getSellerName = (proposal: Proposal) =>
  proposal.profile?.seller_name || proposal.profile?.company_name || 'Responsável comercial';

export const TermsSection = ({ proposal }: { proposal: Proposal }) => {
  const sellerName = getSellerName(proposal);
  const companyName = proposal.profile?.company_name || '';
  const sellerPhone = proposal.profile?.seller_phone || '';
  const sellerEmail = proposal.profile?.seller_email || proposal.profile?.company_email || '';
  const signatureUrl = proposal.profile?.seller_signature_url || null;

  return (
    <View style={{ marginBottom: 40 }}>
      <Text style={styles.sectionTitle}>Escopo e Condições Gerais</Text>
      
      <Text style={styles.title}>O que está incluso nesta proposta:</Text>
      
      <View style={styles.itemContainer}>
        <View style={styles.bullet}></View>
        <Text style={styles.listItem}>Elaboração de projeto executivo e aprovação junto à concessionária de energia.</Text>
      </View>
      <View style={styles.itemContainer}>
        <View style={styles.bullet}></View>
        <Text style={styles.listItem}>Fornecimento de todos os equipamentos (módulos, inversores, estruturas e materiais elétricos).</Text>
      </View>
      <View style={styles.itemContainer}>
        <View style={styles.bullet}></View>
        <Text style={styles.listItem}>Instalação completa do sistema por equipe técnica especializada.</Text>
      </View>
      <View style={styles.itemContainer}>
        <View style={styles.bullet}></View>
        <Text style={styles.listItem}>Homologação, testes e comissionamento do sistema.</Text>
      </View>
      <View style={styles.itemContainer}>
        <View style={styles.bullet}></View>
        <Text style={styles.listItem}>Configuração do aplicativo de monitoramento no celular do cliente.</Text>
      </View>

      <Text style={styles.title}>Condições Comerciais:</Text>
      
      <View style={styles.itemContainer}>
        <View style={styles.bullet}></View>
        <Text style={styles.listItem}>Validade da proposta: {proposal.profile?.default_validity_days || 7} dias a partir da data de emissão.</Text>
      </View>
      <View style={styles.itemContainer}>
        <View style={styles.bullet}></View>
        <Text style={styles.listItem}>O prazo de instalação médio é de 30 a 60 dias úteis após a aprovação do projeto pela concessionária.</Text>
      </View>
      <View style={styles.itemContainer}>
        <View style={styles.bullet}></View>
        <Text style={styles.listItem}>A garantia dos equipamentos segue os termos dos respectivos fabricantes.</Text>
      </View>
      <View style={styles.itemContainer}>
        <View style={styles.bullet}></View>
        <Text style={styles.listItem}>Obrigações civis de estrutura do telhado, alvenaria ou adequação do padrão de entrada não estão inclusas (salvo se descrito em contrato).</Text>
      </View>

      <View style={styles.signatureBox} wrap={false}>
        <Text style={styles.signatureHeader}>Representante comercial</Text>
        {signatureUrl ? (
          <Image src={signatureUrl} style={styles.signatureImage} />
        ) : (
          <View style={styles.signatureLine} />
        )}
        <Text style={styles.sellerName}>{sellerName}</Text>
        <Text style={styles.sellerRole}>Representante comercial</Text>
        {companyName ? <Text style={styles.sellerMeta}>{companyName}</Text> : null}
        {sellerPhone ? <Text style={styles.sellerMeta}>WhatsApp: {sellerPhone}</Text> : null}
        {sellerEmail ? <Text style={styles.sellerMeta}>{sellerEmail}</Text> : null}
      </View>
    </View>
  );
};