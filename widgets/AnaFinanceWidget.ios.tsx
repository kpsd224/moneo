import { Image, HStack, VStack, Text, Spacer, Button } from '@expo/ui/swift-ui';
import { containerBackground, font, foregroundStyle, padding, frame, resizable, aspectRatio, buttonStyle, labelStyle } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { WidgetSnapshot } from '../src/widgetHealth';

// Widget code runs in an isolated runtime. No top-level helper or image reference is allowed.
const AnaFinanceWidget = (props: WidgetSnapshot, environment: WidgetEnvironment) => {
  'widget';
  const large = environment.widgetFamily === 'systemLarge';
  const label = props.label || 'Belum ada dana';
  const percent = Number.isFinite(props.percent) ? Math.max(0, Math.min(100, props.percent)) : 0;
  const ratio = Number.isFinite(props.ratio) ? Math.max(0, Math.min(1, props.ratio)) : 0;
  const pillBg = label === 'Aman' ? '#E7F3E9' : label === 'Waspada' ? '#FFF0D6' : label === 'Hemat' ? '#FCE8F0' : label === 'Kritis' ? '#F8DCE6' : '#E7F3E9';
  const pillText = label === 'Aman' ? '#26754C' : label === 'Waspada' ? '#805A2E' : label === 'Hemat' ? '#9F3B65' : label === 'Kritis' ? '#A92B54' : '#26754C';
  const barWidth = large ? 190 : 164;
  const progressWidth = Math.round(barWidth * ratio);
  const hidden = props.privateMode === true;
  const balanceDisplay = hidden ? 'Rp ••••••' : (props.balanceFullText || props.balanceText);
  const incomeDisplay = hidden ? 'Rp ••••••' : (props.incomeFullText || props.incomeText);
  const expenseDisplay = hidden ? 'Rp ••••••' : (props.expenseFullText || props.expenseText);
  return (
    <HStack spacing={12} modifiers={[containerBackground('#F7F3EC','widget'),padding({all:13})]}>
      {props.mascotUri ?
        <Image uiImage={props.mascotUri} modifiers={[resizable(),aspectRatio({ratio:1,contentMode:'fit'}),frame({width:large?132:118,height:large?150:138})]}/> :
        <VStack spacing={3} modifiers={[frame({width:large?132:118,height:large?150:138})]}>
          <Text modifiers={[font({size:12,weight:'bold'}),foregroundStyle('#26754C')]}>Moneo</Text>
          <Text modifiers={[font({size:11}),foregroundStyle('#526557')]}>Buka aplikasi agar maskot muncul</Text>
        </VStack>
      }
      <VStack spacing={8}>
        <HStack spacing={8}>
          <Text modifiers={[font({size:10}),foregroundStyle('#607367')]}>Saldo Total</Text>
          <Spacer />
          <Button
            label={hidden ? 'Tampilkan nominal' : 'Sembunyikan nominal'}
            systemImage={hidden ? 'eye.slash.fill' : 'eye.fill'}
            target="moneo-toggle-amounts"
            modifiers={[buttonStyle('plain'), labelStyle('iconOnly')]}
            onPress={() => ({ ...props, privateMode: !hidden })}
          />
        </HStack>
        <Text modifiers={[font({size:large?24:20,weight:'bold',design:'rounded'}),foregroundStyle('#173C2E')]}>{balanceDisplay}</Text>
        <HStack spacing={0} modifiers={[containerBackground(pillBg,'widget'),padding({horizontal:7,vertical:4})]}>
          <Text modifiers={[font({size:10,weight:'bold'}),foregroundStyle(pillText)]}>{label} · {percent}%</Text>
        </HStack>
        <HStack spacing={0} modifiers={[frame({width:barWidth,height:8}),containerBackground('#DFE8DE','widget')]}>
          <VStack modifiers={[frame({width:progressWidth,height:8}),containerBackground('#26754C','widget')]}><Spacer /></VStack>
          <Spacer />
        </HStack>
        <HStack spacing={7} modifiers={[padding({all:8}),containerBackground('#FFFEFB','widget')]}>
          <VStack spacing={2}>
            <Text modifiers={[font({size:9,weight:'bold'}),foregroundStyle('#26754C')]}>↑ Pemasukan</Text>
            <Text modifiers={[font({size:10,weight:'bold'}),foregroundStyle('#173C2E')]}>{incomeDisplay}</Text>
          </VStack>
          <VStack spacing={2}>
            <Text modifiers={[font({size:9,weight:'bold'}),foregroundStyle('#B8326B')]}>↓ Pengeluaran</Text>
            <Text modifiers={[font({size:10,weight:'bold'}),foregroundStyle('#173C2E')]}>{expenseDisplay}</Text>
          </VStack>
        </HStack>
      </VStack>
      <Spacer />
    </HStack>
  );
};
export default createWidget<WidgetSnapshot>('AnaFinanceWidget', AnaFinanceWidget, {
  balanceText:'Rp 0',incomeText:'Rp 0',expenseText:'Rp 0',balanceFullText:'Rp 0',incomeFullText:'Rp 0',expenseFullText:'Rp 0',ratio:0,percent:0,
  mood:'thoughtful',label:'Belum ada dana',period:'',privateMode:false,mascotUri:''
});
