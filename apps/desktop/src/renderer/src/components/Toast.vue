<template>
  <div class="toast" :class="{  [type]: true, show: visible }">
    {{ message }}
  </div>
</template>

<script>
export default {
  props: {
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      default: 'success'
    },
    timeout: {
      type: Number,
      default: 1500,
    }
  },
  data() {
    return {
      visible: false
    };
  },
  methods: {
    show() {
      this.visible = true;
      setTimeout(() => {
        this.visible = false;
        this.$emit('hide');
      }, this.timeout);
    }
  },
  mounted() {
    this.show();
  }
};
</script>

<style scoped>
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 10px;
  color: #fff;
  border-radius: 5px;
  opacity: 0;
  transition: opacity 0.5s ease-in-out;
}

.toast.show {
  opacity: 1;
}

.toast.success {
  background-color: green;
}

.toast.error {
  background-color: red;
}
</style>
