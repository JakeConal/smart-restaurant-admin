import { Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class MenuItemModifierGroup {
  @PrimaryColumn('uuid')
  menuItemId: string;

  @PrimaryColumn('uuid')
  groupId: string;
}
