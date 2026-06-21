/**
 * 更新商品的数据传输对象（DTO）
 *
 * PartialType 使所有字段变为可选
 */
import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
