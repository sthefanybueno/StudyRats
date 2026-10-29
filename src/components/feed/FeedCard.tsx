/** Description: Card de uma sessão da comunidade no Feed (somente visualização). */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import type { ItemFeedDTO } from '@/application/dto/ItemFeedDTO';
import { AppText } from '@/components/ui/AppText';
import { Card, Pill } from '@/components/ui/Surface';
import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/providers/ThemeProvider';

import { formatarCoordenadas, formatarTempoRelativo } from './formatadores';

export function FeedCard({ item, agora }: { item: ItemFeedDTO; agora?: Date }) {
  const { colors: Colors } = useAppTheme();
  const styles = useStyles(Colors);
  const temCoordenadas = item.latitude !== undefined && item.longitude !== undefined;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          {item.autor.fotoUrl ? (
            <Image source={{ uri: item.autor.fotoUrl }} style={styles.avatarImage} />
          ) : (
            <AppText variant="label" color={Colors.primary}>
              {item.autor.nome[0]?.toUpperCase()}
            </AppText>
          )}
        </View>
        <View style={styles.flex}>
          <AppText variant="label">{item.autor.nome}</AppText>
          <AppText variant="caption" color={Colors.textMuted}>
            Nv.{item.autor.nivel} · {formatarTempoRelativo(item.createdAt, agora)}
          </AppText>
        </View>
        <Pill tone="primary" label={`+${item.xp} XP`} />
      </View>

      <View>
        <AppText variant="heading">{item.disciplina}</AppText>
        <AppText variant="caption" color={Colors.textSecondary}>
          {item.topico}
        </AppText>
      </View>

      {item.fotoUri && (
        <Image
          source={{ uri: item.fotoUri }}
          style={styles.foto}
          contentFit="cover"
          transition={200}
          accessibilityLabel={`Foto da sessão de ${item.disciplina}`}
        />
      )}

      <View style={styles.footer}>
        <View style={styles.meta}>
          <Ionicons name="timer-outline" size={14} color={Colors.textSecondary} />
          <AppText variant="caption" color={Colors.textSecondary}>
            {item.duracaoMinutos} min
          </AppText>
        </View>
        {temCoordenadas && (
          <View style={styles.meta}>
            <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
            <AppText variant="caption" color={Colors.textSecondary}>
              {formatarCoordenadas(item.latitude as number, item.longitude as number)}
            </AppText>
          </View>
        )}
      </View>
    </Card>
  );
}

const useStyles = (Colors: any) =>
  StyleSheet.create({
    card: { gap: Spacing.three, padding: Spacing.three + 2 },
    header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two + 2 },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: Colors.surfaceRaised,
      borderWidth: 1,
      borderColor: Colors.borderStrong,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImage: { width: 40, height: 40 },
    foto: { width: '100%', aspectRatio: 3 / 2, borderRadius: Radius.md, backgroundColor: Colors.surfaceInput },
    footer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.three },
    meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    flex: { flex: 1 },
  });

