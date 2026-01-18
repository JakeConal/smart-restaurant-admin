import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { MenuItem } from './menu-item.schema';
import { ModifierGroup } from './modifier-group.schema';

@Entity()
export class MenuItemModifierGroup {
  @PrimaryColumn('uuid')
  menuItemId: string;

  @PrimaryColumn('uuid')
  groupId: string;

  @ManyToOne(() => MenuItem, (item) => item.modifierGroupLinks)
  @JoinColumn({ name: 'menuItemId' })
  menuItem: MenuItem;

  @ManyToOne(() => ModifierGroup, (group) => group.menuItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group: ModifierGroup;
}
