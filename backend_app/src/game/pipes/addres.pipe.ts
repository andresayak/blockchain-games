import { BadRequestException, PipeTransform } from "@nestjs/common";
import { ethers } from "ethers";

export class ParseAddressPipe implements PipeTransform {
  async transform(value: string) {
    if (!ethers.isAddress(value)) {
      throw new BadRequestException("Invalid address");
    }
    return value;
  }
}
