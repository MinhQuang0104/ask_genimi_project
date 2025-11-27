
const rules = {
    notNullOrEmpty(value) {
        // // đưa value này qua lần lượt các rule
        // console.log("in rule notNull: " + value)
        return !(
            value === null ||
            value === undefined ||
            // kiêm tra với trường hợp chuỗi rỗng, chuỗi chỉ có khoảng trắng ở giữa
            (typeof value === 'string' && (value.trim() === '' || value.trim().toLowerCase() === 'null'))
        );
    },
    // chuỗi không chứa khoảng trắng
    notWhiteSpace(value) {
        return /^[^\s]+$/.test(value);
    },
    // chuỗi không chứa chữ số
    noDigit(value) {
        return /^[^\d]+$/.test(value);
    },
    // độ dài tối đa
    maxLength(value, max) {
        return value.length <= max;
    },
    // độ dài tối thiểu 
    minLength(value, min) {
        return value.length >= min;
    },
    // viết hoa chữ cái đầu
    upperFirstLetter(value) {
    },
    textFullUpper(value) {

    },
    // toàn bộ ký tự (a-z) trong chuỗi phải viêt hoa (ký tự trong chuỗi)
    textFullLower(value) {
    
    },
    isInteger(value) {
        return /^\d+$/.test(value)
    },
    isDecimal(value) {
        return /^-?\d+\.\d+$/.test(value);
    },
    isNonNegative(value) {
        return /^\d+(\.\d+)?$/.test(value);
    },
    isNullable(value){
        return value === null || value === undefined || (typeof value === 'string' && value.trim().toLowerCase() === 'null');
    },
    greatetThanToday(value) {

    },
    greatetThan(value, compareTo) {
        return value > compareTo;
    },
    greaterThanOrEqual(value, compareTo) {
        return value >= compareTo;
    },
    // chỉ chữa chữ cái và số
    alphaNumericOnly(value) {
        return /^[a-zA-Z0-9]+$/.test(value);
    },
    inSet(value, [...validSet]) {
      return validSet.includes(value);  
    },
    isBeforeOrEqualCurrentDay(value) {
        const inputDate = new Date(value);
        if (isNaN(inputDate)) return false; // giá trị không hợp lệ
        const today = new Date();
        
        // Xóa giờ phút giây để so sánh theo ngày
        inputDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        return inputDate <= today;
    }

}

module.exports = rules;
