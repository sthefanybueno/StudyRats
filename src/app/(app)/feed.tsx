/** Description: Tela Feed: sessões da comunidade, da mais recente para a mais antiga (50 por página). Somente visualização. */
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/Brand';
import { FeedCard } from '@/components/feed/FeedCard';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Surface';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useFeed } from '@/hooks/useFeed';
import { useAppTheme } from '@/providers/ThemeProvider';

export default function FeedScreen() {
  const { colors: Colors } = useAppTheme();
  const styles = useStyles(Colors);
  const { itens, carregando, atualizando, carregandoMais, erro, temMais, atualizar, tentarNovamente, carregarMais } =
    useFeed();

  const cabecalho = (
    <View style={styles.header}>
      <BrandMark subtitle="Feed" />
      <AppText variant="overline" color={Colors.textSecondary}>
        SESSÕES DA COMUNIDADE
      </AppText>
    </View>
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        {carregando ? (
          <View style={styles.center}>
            {cabecalho}
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : erro && itens.length === 0 ? (
          <View style={styles.content}>
            {cabecalho}
            <Card style={styles.stateCard}>
              <Ionicons name="cloud-offline-outline" size={28} color={Colors.warning} />
              <AppText variant="body" style={styles.centerText}>
                Não foi possível carregar o feed.
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary} style={styles.centerText}>
                {erro}
              </AppText>
              <Button label="Tentar novamente" icon="refresh" variant="secondary" onPress={tentarNovamente} />
            </Card>
          </View>
        ) : (
          <FlatList
            data={itens}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <FeedCard item={item} />}
            ListHeaderComponent={cabecalho}
            contentContainerStyle={styles.content}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            refreshing={atualizando}
            onRefresh={atualizar}
            onEndReached={temMais ? carregarMais : undefined}
            onEndReachedThreshold={0.4}
            initialNumToRender={6}
            windowSize={7}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Card style={styles.stateCard}>
                <Ionicons name="newspaper-outline" size={28} color={Colors.textMuted} />
                <AppText variant="body" style={styles.centerText}>
                  Ainda não há sessões da comunidade.
                </AppText>
              </Card>
            }
            ListFooterComponent={
              carregandoMais ? (
                <ActivityIndicator color={Colors.primary} style={styles.footer} />
              ) : !temMais && itens.length > 0 ? (
                <AppText variant="caption" color={Colors.textMuted} style={[styles.centerText, styles.footer]}>
                  Você chegou ao fim do feed.
                </AppText>
              ) : (
                <View />
              )
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const useStyles = (Colors: any) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },
    flex: { flex: 1 },
    header: { gap: Spacing.two, marginBottom: Spacing.three },
    content: {
      width: '100%',
      maxWidth: MaxContentWidth,
      alignSelf: 'center',
      paddingHorizontal: Spacing.four,
      paddingVertical: Spacing.four,
    },
    center: { flex: 1, padding: Spacing.four, gap: Spacing.four },
    separator: { height: Spacing.three },
    stateCard: { alignItems: 'center', gap: Spacing.two + 2, padding: Spacing.four },
    centerText: { textAlign: 'center' },
    footer: { marginVertical: Spacing.four },
  });

