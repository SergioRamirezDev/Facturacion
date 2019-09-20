import {Pipe} from '@angular/core'

@Pipe({
  name:'toDecimal'
})

export class toDecimal{
  transform(input:number){
    if(isNaN(input) === false && input !== Infinity){
      if(input % 1 != 0){
        return parseFloat(input.toString()).toFixed(2)
      }else{
        return input
      }
    }else{
      return 0;
    }
  }
}
